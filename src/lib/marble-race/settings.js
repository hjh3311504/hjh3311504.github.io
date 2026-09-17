import { ACTIVE_BLOCK_TYPES, parseNames, resolveMapId } from './catalog.js';
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
				m.layers.every((t) => ACTIVE_BLOCK_TYPES.includes(t))
		)
		.slice(0, 10)
		.map((m) => ({
			id: m.id,
			name: m.name.trim(),
			layers: [...m.layers],
			caption: '내가 고른 네 가지 소리',
			icon: '✦',
			colors: ['#76dbc0', '#bba4f5']
		}));
}
export function readSettings(storage) {
	const defaults = {
		namesText: DEFAULT_NAMES,
		mapId: 'crunch',
		mode: 'first',
		count: 3,
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
			if (typeof saved.soundEnabled === 'boolean') defaults.soundEnabled = saved.soundEnabled;
			if (Number.isFinite(saved.volume)) defaults.volume = Math.max(0, Math.min(100, saved.volume));
		}
	} catch {
		message = '저장된 설정을 읽지 못했어요. 새 명단으로 시작할 수 있습니다.';
	}
	return { ...defaults, customMaps, message };
}
export function validateDraw(mode, count, nth, total) {
	const value = mode === 'nth' ? nth : count;
	return ['nth', 'multiple'].includes(mode) &&
		(!Number.isSafeInteger(value) || value < 1 || value > total)
		? `당첨 ${mode === 'nth' ? '순번' : '인원'}을1부터 구슬 수 사이의 정수로 입력해 주세요.`
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
