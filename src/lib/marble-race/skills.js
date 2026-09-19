// 경기 시간 기준 확률과 별도 난수를 써서 배속·화면 갱신에 영향을 받지 않는다.
export const PULSE_RADIUS = 120;
export const PULSE_DURATION = 0.45;
export const SKILL_CHANCE_PER_SECOND = 0.005;
export const SKILL_COOLDOWN = 8;

export function createSkills(seed, enabled = false) {
	return {
		enabled,
		randomState: (seed ^ 0x51a7c3e9) >>> 0,
		cooldowns: new Map(),
		waves: [],
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

export function updateSkills(skills, marbles, time, dt) {
	skills.waves = skills.enabled
		? skills.waves.filter((wave) => time - wave.time < PULSE_DURATION)
		: [];
	if (!skills.enabled || time < 2) return [];
	const fired = [];
	const chance = 1 - Math.exp(-SKILL_CHANCE_PER_SECOND * dt);
	for (const source of marbles) {
		if (source.finished || source.held || time < (skills.cooldowns.get(source.id) ?? 0)) continue;
		if (random(skills) < chance) fired.push(firePulse(skills, source, marbles, time));
	}
	return fired;
}
