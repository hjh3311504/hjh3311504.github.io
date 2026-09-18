import {
	DEFAULT_MAP_ID,
	ACTIVE_BLOCK_TYPES,
	migrateBlockType,
	parseNames,
	resolveMapId
} from './catalog.js';
export const SETTINGS_KEY = 'lake.marble-race.v1';
export const CUSTOM_MAPS_KEY = 'lake.marble-race.custom-maps.v1';
export const DEFAULT_NAMES =
	'토끼,고양이,오리,펭귄,수달,곰,여우,햄스터,강아지,다람쥐,판다,코알라,기린,코끼리,사자,호랑이,얼룩말,하마,코뿔소,사슴,고슴도치,너구리,미어캣,알파카,캥거루,돌고래,고래,물개,거북이,부엉이'
		.split(',')
		.join('\n');
export function validateCustomMaps(value) {
	if (!Array.isArray(value)) return [];
	const ids = new Set();
	return value
		.filter(
			(m) =>
				m &&
				typeof m.id === 'string' &&
				m.id.startsWith('custom-') &&
				!ids.has(m.id) &&
				ids.add(m.id) &&
				typeof m.name === 'string' &&
				m.name.trim() &&
				m.name.length <= 40 &&
				Array.isArray(m.layers) &&
				m.layers.length === 4 &&
				m.layers.every((t) => ACTIVE_BLOCK_TYPES.includes(migrateBlockType(t)))
		)
		.slice(0, 10)
		.map((m) => ({
			id: m.id,
			name: m.name.trim(),
			layers: m.layers.map(migrateBlockType),
			caption: '내가 고른 네 가지 소리',
			icon: '✦',
			colors: ['#76dbc0', '#bba4f5']
		}));
}
export function readSettings(storage) {
	const defaults = {
		namesText: DEFAULT_NAMES,
		mapId: DEFAULT_MAP_ID,
		mode: 'first',
		count: 3,
		rangeText: '1~3',
		nth: 1,
		soundEnabled: true,
		volume: 45
	};
	let customMaps = [],
		message = '';
	try {
		customMaps = validateCustomMaps(JSON.parse(storage.getItem(CUSTOM_MAPS_KEY) || '[]'));
	} catch {
		message = '저장한 내 맵을 읽지 못했어요. 기본 맵으로 시작할 수 있습니다.';
	}
	try {
		const saved = JSON.parse(storage.getItem(SETTINGS_KEY) || 'null');
		if (saved && typeof saved === 'object') {
			if (typeof saved.namesText === 'string') defaults.namesText = saved.namesText;
			defaults.mapId = resolveMapId(saved.mapId, customMaps);
			if (['first', 'last', 'multiple', 'nth'].includes(saved.mode)) defaults.mode = saved.mode;
			for (const key of ['count', 'nth'])
				if (Number.isSafeInteger(saved[key]) && saved[key] > 0) defaults[key] = saved[key];
			defaults.rangeText =
				typeof saved.rangeText === 'string' ? saved.rangeText : `1~${defaults.count}`;
			if (typeof saved.soundEnabled === 'boolean') defaults.soundEnabled = saved.soundEnabled;
			if (Number.isFinite(saved.volume)) defaults.volume = Math.max(0, Math.min(100, saved.volume));
		}
	} catch {
		message = '저장된 설정을 읽지 못했어요. 새 명단으로 시작할 수 있습니다.';
	}
	return { ...defaults, customMaps, message };
}
export function parseDrawRange(text, total) {
	const match = typeof text === 'string' && /^\s*(\d+)\s*~\s*(\d+)\s*$/.exec(text);
	const invalid = (error) => ({ start: 1, end: 1, count: 1, error });
	if (!match) return invalid('시작 순위와 끝 순위를 양의 정수로 입력해 주세요.');
	const start = Number(match[1]),
		end = Number(match[2]);
	if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end > total)
		return invalid('당첨 순위는1부터 전체 구슬 수 사이의 정수로 입력해 주세요.');
	if (start > end) return invalid('시작 순위는 끝 순위보다 클 수 없어요.');
	return { start, end, count: end - start + 1, error: '' };
}
export function validateDraw(mode, count, nth, total, startRank = 1) {
	if (mode === 'multiple')
		return !Number.isSafeInteger(count) ||
			count < 1 ||
			!Number.isSafeInteger(startRank) ||
			startRank < 1 ||
			startRank > total ||
			count > total - startRank + 1
			? '당첨 순위는1부터 전체 구슬 수 사이의 정수로 입력해 주세요.'
			: '';
	return mode === 'nth' && (!Number.isSafeInteger(nth) || nth < 1 || nth > total)
		? '당첨 순번을1부터 구슬 수 사이의 정수로 입력해 주세요.'
		: '';
}
export function previewParticipants(text) {
	const parsed = parseNames(text);
	return parsed.error ? parseNames(DEFAULT_NAMES) : parsed;
}
export function createSettingsWriter(storage, onError) {
	let timer, pending;
	function flush() {
		clearTimeout(timer);
		if (!pending) return;
		const value = pending;
		pending = null;
		try {
			storage.setItem(SETTINGS_KEY, JSON.stringify(value.settings));
			storage.setItem(CUSTOM_MAPS_KEY, JSON.stringify(value.customMaps));
		} catch {
			onError('설정을 저장하지 못했어요. 현재 경기는 그대로 진행할 수 있습니다.');
		}
	}
	return {
		schedule(settings, customMaps) {
			pending = { settings, customMaps };
			clearTimeout(timer);
			timer = setTimeout(flush, 200);
		},
		flush,
		destroy: flush
	};
}
