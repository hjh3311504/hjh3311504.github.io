// 경기 시간 기준 확률과 별도 난수를 써서 배속·화면 갱신에 영향을 받지 않는다.
export const PULSE_RADIUS = 120;
export const PULSE_DURATION = 0.45;
export const SKILL_TYPES = ['pulse', 'lightning', 'gust'];
export const LIGHTNING_RANGE = 240;
export const LIGHTNING_WIDTH = 32;
export const LIGHTNING_DURATION = 0.35;
export const LIGHTNING_HOLD = 2;
export const GUST_WIDTH = 120;
export const GUST_HEIGHT = 240;
export const GUST_DURATION = 1;
export const GUST_SPEED = 650;
export const SKILL_DURATIONS = {
	pulse: PULSE_DURATION,
	lightning: LIGHTNING_DURATION,
	gust: GUST_DURATION
};
// 구슬마다 초당 약0.5%의 기본 발동률을 사용한다.
export const SKILL_CHANCE_PER_SECOND = 0.005;
export const SKILL_COOLDOWN = 8;

export function createSkills(seed, enabled = false) {
	return {
		enabled,
		randomState: (seed ^ 0x51a7c3e9) >>> 0,
		cooldowns: new Map(),
		waves: [],
		gustHits: new Map(),
		serial: 0
	};
}

function random(skills) {
	skills.randomState = (skills.randomState + 0x6d2b79f5) >>> 0;
	let t = Math.imul(skills.randomState ^ (skills.randomState >>> 15), 1 | skills.randomState);
	t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function firePulse(skills, source, marbles, time) {
	skills.cooldowns.set(source.id, time + SKILL_COOLDOWN);
	const wave = {
		type: 'pulse',
		id: ++skills.serial,
		sourceId: source.id,
		x: source.x,
		y: source.y,
		color: source.color,
		time
	};
	skills.waves.push(wave);
	for (const target of marbles) {
		if (target === source || target.finished || target.held) continue;
		const dx = target.x - source.x,
			dy = target.y - source.y;
		const distance = Math.hypot(dx, dy);
		if (distance >= PULSE_RADIUS) continue;
		const angle = ((source.id + 1) * 2.399963 + (target.id + 1) * 1.618034) % (Math.PI * 2);
		const nx = distance > 0.001 ? dx / distance : Math.cos(angle);
		const ny = distance > 0.001 ? dy / distance : Math.sin(angle);
		const impulse = 780 * (1 - (0.65 * distance) / PULSE_RADIUS);
		target.vx += nx * impulse;
		target.vy += ny * impulse;
		target.pulseBoostUntil = time + 0.65;
	}
	return wave;
}

function eligible(target, source) {
	return target.id !== source.id && !target.finished && !target.held;
}

function effect(skills, source, time, type, shape) {
	skills.cooldowns.set(source.id, time + SKILL_COOLDOWN);
	const wave = {
		id: ++skills.serial,
		type,
		sourceId: source.id,
		color: source.color,
		time,
		...shape
	};
	skills.waves.push(wave);
	return wave;
}

export function fireLightning(skills, source, marbles, time) {
	const candidates = marbles.filter((target) => eligible(target, source));
	if (!candidates.length) return null;
	let target,
		nearest = LIGHTNING_RANGE;
	for (const candidate of candidates) {
		const distance = Math.hypot(candidate.x - source.x, candidate.y - source.y);
		if (distance <= nearest && (!target || distance < nearest)) {
			target = candidate;
			nearest = distance;
		}
	}
	target ??= candidates[Math.floor(random(skills) * candidates.length)];
	const wave = effect(skills, source, time, 'lightning', {
		x: target.x,
		y: target.y,
		top: 0,
		width: LIGHTNING_WIDTH,
		targetId: target.id
	});
	for (const marble of candidates) {
		// 세로 번개의 실제 폭과 끝부분에 공의 반지름을 더해 접촉을 판정한다.
		const dx = Math.max(0, Math.abs(marble.x - wave.x) - wave.width / 2);
		const dy = Math.max(wave.top - marble.y, marble.y - wave.y, 0);
		if (Math.hypot(dx, dy) > (marble.r ?? 10)) continue;
		marble.vx = marble.vy = 0;
		marble.held = { kind: 'lightning', until: time + LIGHTNING_HOLD, x: marble.x, y: marble.y };
		marble.pinRest = null;
		marble.pulseBoostUntil = 0;
		marble.windUntil = 0;
	}
	return wave;
}

export function applyGusts(skills, marbles, time) {
	for (const wave of skills.waves) {
		if (wave.type !== 'gust' || time < wave.time || time >= wave.time + GUST_DURATION) continue;
		const hits = skills.gustHits.get(wave.id);
		for (const marble of marbles) {
			if (marble.id === wave.sourceId || marble.finished || marble.held || hits.has(marble.id))
				continue;
			const dx = Math.max(0, Math.abs(marble.x - wave.x) - wave.width / 2);
			const dy = Math.max(wave.y - wave.height - marble.y, marble.y - wave.y, 0);
			if (Math.hypot(dx, dy) > (marble.r ?? 10)) continue;
			marble.vy = -GUST_SPEED;
			marble.pinRest = null;
			marble.lastProgress = time;
			hits.add(marble.id);
		}
	}
}

export function fireGust(skills, source, marbles, time) {
	const wave = effect(skills, source, time, 'gust', {
		x: source.x,
		y: source.y + (source.r ?? 10) + 8,
		width: GUST_WIDTH,
		height: GUST_HEIGHT
	});
	skills.gustHits.set(wave.id, new Set());
	applyGusts(skills, marbles, time);
	return wave;
}

export function updateSkills(skills, marbles, time, dt) {
	skills.waves = skills.enabled
		? skills.waves.filter((wave) => time - wave.time < SKILL_DURATIONS[wave.type])
		: [];
	const liveIds = new Set(skills.waves.map((wave) => wave.id));
	for (const id of skills.gustHits.keys()) if (!liveIds.has(id)) skills.gustHits.delete(id);
	if (!skills.enabled || time < 2) return [];
	const fired = [];
	const chance = 1 - Math.exp(-SKILL_CHANCE_PER_SECOND * dt);
	for (const source of marbles) {
		if (source.finished || source.held || time < (skills.cooldowns.get(source.id) ?? 0)) continue;
		if (random(skills) < chance) {
			const fire = [firePulse, fireLightning, fireGust][
				Math.floor(random(skills) * SKILL_TYPES.length)
			];
			const wave = fire(skills, source, marbles, time);
			if (wave) fired.push(wave);
		}
	}
	return fired;
}
