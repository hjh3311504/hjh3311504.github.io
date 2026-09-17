export const BLOCKS = {
	wood: {
		restitution: 0.59,
		friction: 0.35,
		name: '나무',
		symbol: '≋',
		color: '#d6a06b',
		description: '톡! 작은 조각으로 깨져요.',
		sound: '단단한 톡·딱'
	},
	glass: {
		restitution: 0.63,
		friction: 0.08,
		name: '유리',
		symbol: '◇',
		color: '#87dbe7',
		description: '맑은 소리와 함께 반짝이며 깨져요.',
		sound: '맑은 팅·차르르'
	},
	sand: {
		restitution: 0.55,
		friction: 0.65,
		name: '키네틱 샌드',
		symbol: '⠿',
		color: '#edcd83',
		description: '촘촘한 모래 덩어리가 사각사각 무너져요.',
		sound: '부드러운 사각'
	},
	bubble: {
		restitution: 0.55,
		friction: 0.01,
		name: '비눗방울',
		symbol: '○',
		color: '#d8baf3',
		description: '가볍게 뽁! 통통 되튕기며 터져요.',
		sound: '가벼운 뽁'
	},
	ice: {
		restitution: 0.63,
		friction: 0.03,
		name: '얼음',
		symbol: '❄',
		color: '#b2e9f7',
		description: '한 번 닿으면 맑게 깨지고 잘 튕겨요.',
		sound: '맑은 챙'
	},
	gel: {
		name: '점성 젤',
		symbol: '≈',
		color: '#9cddac',
		description: '사라지지 않고 구슬을 천천히 통과시켜요.',
		sound: '낮은 꾸르륵'
	},
	sticky: {
		name: '끈끈이',
		symbol: '⌁',
		color: '#efb2d1',
		description: '1초 동안 붙잡았다가 놓아줘요.',
		sound: '착·쫀득'
	},
	spring: {
		name: '스프링',
		symbol: '⇈',
		color: '#f5b971',
		description: '꾹 눌린 방향의 반대로 멀리 튕겨요.',
		sound: '탄력 있는 통'
	},
	rubber: {
		name: '고무 범퍼',
		symbol: '◎',
		color: '#baaff3',
		description: '닿은 면의 반대 방향으로 통통 튕겨요.',
		sound: '둥근 퐁'
	},
	slide: {
		name: '미끄럼판',
		symbol: '↘',
		color: '#8bbce7',
		description: '경사를 따라 옆으로 미끄러져요.',
		sound: '짧은 스르륵'
	},
	rotor: {
		name: '회전 날개',
		symbol: '✣',
		color: '#eea19b',
		description: '돌아가는 날개가 구슬을 옆으로 밀어요.',
		sound: '낮은 도독'
	},
	seesaw: {
		name: '시소',
		symbol: '↔',
		color: '#d9b98c',
		description: '구슬이 올라간 쪽으로 기울어져요.',
		sound: '작은 달칵'
	},
	wind: {
		name: '바람 블록',
		symbol: '↑',
		color: '#8ddacc',
		description: '바람으로 옆으로 밀고 낙하를 늦춰요.',
		sound: '잔잔한 후우'
	},
	gate: {
		name: '개폐문',
		symbol: '▥',
		color: '#a5b7d6',
		description: '잠깐 모아 두었다가 문을 열어 놓아줘요.',
		sound: '작은 찰칵'
	},
	thock: {
		restitution: 0.61,
		friction: 0.25,
		name: '도각 키보드',
		symbol: '⌨',
		color: '#dfc9ac',
		description: '키캡이 도각 눌리고 빠져요.',
		sound: '낮고 둥근 도각'
	},
	clicky: {
		restitution: 0.63,
		friction: 0.2,
		name: '청축 키보드',
		symbol: '⌨',
		color: '#b8c9ed',
		description: '청축 스위치가 선명하게 찰칵 울려요.',
		sound: '선명한 찰칵'
	},
	switch: {
		restitution: 0.61,
		friction: 0.25,
		name: '스위치',
		symbol: '◩',
		color: '#f1df9e',
		description: '딸깍 뒤집히며 통로가 열려요.',
		sound: '짧은 딸깍'
	},
	waxball: {
		restitution: 0.59,
		friction: 0.35,
		name: '왁뿌볼',
		symbol: '◉',
		color: '#f1b4cc',
		description: '공이 눌리며 속의 왁스가 깨져요.',
		sound: '잘게 깨지는 오도독'
	},
	waxbutter: {
		restitution: 0.57,
		friction: 0.45,
		name: '왁스 버터',
		symbol: '▧',
		color: '#f5da7b',
		description: '얇은 껍질이 깨지고 속이 눌려요.',
		sound: '얇은 빠삭'
	},
	popit: {
		restitution: 0.65,
		friction: 0.3,
		name: '팝잇',
		symbol: '⊙',
		color: '#c9b6ef',
		description: '볼록한 부분이 뽁 뒤집혀요.',
		sound: '둥근 뽁'
	},
	wrap: {
		restitution: 0.57,
		friction: 0.25,
		name: '뽁뽁이',
		symbol: '⠶',
		color: '#b9e1ed',
		description: '작은 공기방울이 짧게 톡 터져요.',
		sound: '짧고 또렷한 톡'
	},
	slime: {
		restitution: 0.55,
		friction: 0.75,
		name: '슬라임',
		symbol: '∿',
		color: '#b7df91',
		description: '납작하게 퍼지며 구슬을 튕겨요.',
		sound: '촉촉한 꾸덕·뽀글'
	},
	foam: {
		restitution: 0.57,
		friction: 0.55,
		name: '거품 스펀지',
		symbol: '▦',
		color: '#f0bea1',
		description: '꾹 눌리며 작은 거품을 내요.',
		sound: '부드러운 푸슉·자글'
	}
};

// 일반 도감과 경기에서 사용하는 소재. 다른 정의는 기존 장치 물리 처리용이다.
BLOCKS.soap = {
	restitution: 0.59,
	friction: 0.45,
	name: '비누',
	symbol: '▤',
	color: '#efb6d1',
	description: '얇은 비누 조각이 바삭하게 갈라져요.',
	sound: '건조한 사각·바삭'
};
BLOCKS.typewriter = {
	restitution: 0.61,
	friction: 0.25,
	name: '옛날 타자기',
	symbol: '▣',
	color: '#bac5cf',
	description: '둥근 문자 키가 눌리며 철컥·탁 울려요.',
	sound: '단단한 금속 타건'
};
export const BREAKABLE_TYPES = [
	'thock',
	'clicky',
	'typewriter',
	'slime',
	'sand',
	'soap',
	'waxball',
	'popit',
	'wrap',
	'asmr',
	'cork',
	'wood',
	'ember',
	'droplet',
	'frog',
	'duck'
];
BLOCKS.asmr = {
	restitution: 0.59,
	friction: 0.25,
	name: '물풍선',
	symbol: '🎈',
	color: '#9bdcec',
	description: '물풍선이 눌리며 물방울처럼 톡 터져요.',
	sound: '톡 터지는 물풍선'
};
BLOCKS.cork = {
	restitution: 0.59,
	friction: 0.35,
	name: '코르크',
	symbol: '▰',
	color: '#d5b183',
	description: '마개가 뽁 빠지며 작은 조각으로 흩어져요.',
	sound: '짧은 마개 팝'
};
BLOCKS.ember = {
	restitution: 0.59,
	friction: 0.35,
	name: '불씨',
	symbol: '✦',
	color: '#ed9a61',
	description: '작은 불씨가 타닥 튀며 흩어져요.',
	sound: '잔불이 이어지는 타닥타닥'
};
BLOCKS.droplet = {
	restitution: 0.59,
	friction: 0.25,
	name: '물방울',
	symbol: '◊',
	color: '#8dd7ed',
	description: '물방울이 똑 떨어지며 잔물결을 만들어요.',
	sound: '또렷한 똑'
};
BLOCKS.frog = {
	restitution: 0.61,
	friction: 0.25,
	name: '개구리',
	symbol: '●',
	color: '#a2d679',
	description: '개구리가 짧게 개굴 울며 사라져요.',
	sound: '짧은 개굴'
};
BLOCKS.duck = {
	restitution: 0.61,
	friction: 0.25,
	name: '오리',
	symbol: '●',
	color: '#f4d779',
	description: '오리가 꽥 울며 작은 조각으로 흩어져요.',
	sound: '또렷한 꽥'
};
// 긴 질감4종과 물풍선은 정의·음원을 보존하고 경기·도감에서 제외한다.
export const ACTIVE_BLOCK_TYPES = [
	'thock',
	'clicky',
	'typewriter',
	'popit',
	'wrap',
	'cork',
	'wood',
	'ember',
	'droplet',
	'frog',
	'duck'
];
export const SOUND_TYPES = [...BREAKABLE_TYPES, 'rubber'];
for (const type of SOUND_TYPES) {
	const interval = { sand: 0.06, soap: 0.09, slime: 0.08, waxball: 0.15, rubber: 0.1 }[type];
	BLOCKS[type].audio =
		interval === undefined
			? { group: 'percussion', maxVoices: 12, interval: 0.028, level: 1 }
			: {
					group: type === 'rubber' ? 'device' : 'texture',
					maxVoices: type === 'rubber' ? 1 : 3,
					interval,
					level: type === 'rubber' ? 0.45 : 1
				};
}
for (const type of ['clicky', 'typewriter']) {
	BLOCKS[type].audio = { group: 'percussion', maxVoices: 3, interval: 0.06, level: 1 };
}
BLOCKS.asmr.audio = { group: 'percussion', maxVoices: 3, interval: 0.1, level: 1 };
// 울음의 몸통은 유지하되 겹침이 새 타격을 가리지 않게 한다.
for (const type of ['frog', 'duck']) {
	BLOCKS[type].audio = { group: 'percussion', maxVoices: 3, interval: 0.1, level: 0.85 };
}
BLOCKS.ember.audio = { group: 'percussion', maxVoices: 3, interval: 0.12, level: 0.85 };
export const SAVED_MAPS = [
	{
		id: 'keyboard',
		name: '도각도각 키보드',
		caption: '경쾌한 타건과 팝',
		icon: '⌨',
		colors: ['#dfc9ac', '#b8c9ed'],
		layers: ['thock', 'clicky', 'typewriter', 'popit']
	},
	{
		id: 'crunch',
		name: '톡톡 나무공방',
		caption: '나무·코르크와 타닥이는 불씨',
		icon: '◇',
		colors: ['#d6a06b', '#d5b183'],
		layers: ['wood', 'cork', 'ember', 'wrap']
	},
	{
		id: 'soft',
		name: '뽁뽁 물놀이',
		caption: '물방울·개구리·오리와 둥근 팝',
		icon: '≈',
		colors: ['#8dd7ed', '#a2d679'],
		layers: ['droplet', 'frog', 'duck', 'popit']
	}
].map((map) => ({
	...map,
	types: [...new Set([...map.layers, 'butter', 'pond', 'rubber', 'fanfare'])]
}));

export const MAPS = SAVED_MAPS;

export function resolveMapId(id, customMaps = []) {
	const migrated = { workshop: 'keyboard', toys: 'crunch', bounce: 'soft' }[id] ?? id;
	return [...MAPS, ...customMaps].some((map) => map.id === migrated) ? migrated : 'crunch';
}

export const MARBLE_COLORS = [
	'#76dbc0',
	'#f4be72',
	'#bba4f5',
	'#7cbeed',
	'#f295ae',
	'#daeb82',
	'#e2ae87',
	'#a5c6ff'
];
// 입력 단계에서는 반복 명단을 펼치지 않는다.
export function parseNames(text) {
	const entries = [];
	let count = 0;
	let error = '';
	for (const item of text
		.split(/[,\n\r]+/u)
		.map((value) => value.trim())
		.filter(Boolean)) {
		const parts = item.split('*');
		const name = parts[0].trim();
		const copies = parts.length === 1 ? 1 : Number(parts[1].trim());
		if (
			!name ||
			parts.length > 2 ||
			(parts.length === 2 && !/^\d+$/.test(parts[1].trim())) ||
			!Number.isSafeInteger(copies) ||
			copies < 1
		) {
			error = `“${item}”: 이름*양의 정수 형식으로 입력해 주세요.`;
			break;
		}
		if ([...name].length > 20) {
			error = `“${name}”: 이름은 각각20자 이내로 입력해 주세요.`;
			break;
		}
		if (!Number.isSafeInteger(count + copies)) {
			error = '전체 구슬 수가 정확하게 계산할 수 있는 범위를 넘었어요.';
			break;
		}
		entries.push({ name, count: copies });
		count += copies;
	}
	if (!error && count < 2) error = '구슬을2개 이상 입력해 주세요.';
	return {
		entries,
		count,
		error,
		get names() {
			return entries.flatMap((entry) => Array(entry.count).fill(entry.name));
		}
	};
}
export function resolveMap(value, customMaps = []) {
	if (
		value &&
		typeof value === 'object' &&
		value.layers?.length === 4 &&
		value.layers.every((type) => ACTIVE_BLOCK_TYPES.includes(type))
	)
		return {
			...value,
			types: [...new Set([...value.layers, ...SPECIAL_TYPES, 'rubber', 'fanfare'])]
		};
	const id = resolveMapId(value, customMaps);
	return resolveMap([...MAPS, ...customMaps].find((map) => map.id === id));
}
export const SPECIAL_TYPES = ['butter', 'pond'];
BLOCKS.scatter = {
	name: '분산 통로',
	color: '#8bbce7',
	symbol: '↘',
	description: '둥근 유도벽과 엇갈린 핀이 구슬을 흩어 놓아요.'
};
BLOCKS.butter = {
	...BLOCKS.waxbutter,
	name: '버터',
	description: '구슬이 많을수록 더 여러 번 부딪혀야 부서져요.3초 후 돌아와요.',
	sound: '왁뿌볼의 오도독',
	audio: { group: 'device', maxVoices: 3, interval: 0.1, level: 0.75 }
};
BLOCKS.pond = {
	...BLOCKS.gel,
	name: '젤리 연못',
	description: '퐁당 들어가 천천히 가라앉아요. 한쪽 우회로로 피해 갈 수도 있어요.',
	sound: '기존 물풍선의 풍덩',
	audio: { group: 'device', maxVoices: 3, interval: 0.1, level: 0.8 }
};
BLOCKS.fanfare = {
	name: '당첨 축하',
	audio: { group: 'celebration', maxVoices: 1, interval: 0, level: 0.8 }
};
SOUND_TYPES.push('butter', 'pond', 'fanfare');
