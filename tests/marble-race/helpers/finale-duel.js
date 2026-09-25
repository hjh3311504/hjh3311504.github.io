import { createRace, makeBlock } from '../../../src/lib/marble-race/physics.js';

// 선두가30만큼 앞선 같은 진입 상태를 사용해 입구 배치의 차이만 비교한다.
export function createFinaleDuel({
	previous = false,
	phase = Math.PI / 8,
	side = -1,
	currentGuide = false
} = {}) {
	const race = createRace(['선두', '추격'], 'keyboard', 47);
	// 과거 회전바 비교는 당시 직선 지형·진입 위치를 고정한다.
	if (!currentGuide) restoreStraightGuide(race);
	const bar = race.blocks.find((block) => block.id === 'finale-bar');
	if (!currentGuide) {
		Object.assign(bar, {
			x: 210,
			y: race.layout.finale.start + 410,
			w: 320,
			direction: -1,
			angularSpeed: (Math.PI * 2) / 4.4
		});
		race.layout.finale.rotor = { x: bar.x, y: bar.y };
	}
	if (previous) {
		Object.assign(bar, { x: 290, y: race.layout.finale.start + 400, w: 180 });
		race.layout.finale.rotor = { x: bar.x, y: bar.y };
	}
	bar.phase = phase;
	race.marbles.forEach((marble, index) =>
		Object.assign(marble, {
			x: 360 + side * (index === 0 ? -35 : 35),
			y: race.layout.finale.mouthY - ((index === 0 ? 45 : 75) + (currentGuide ? 100 : 0)),
			vx: 0,
			vy: 150,
			finaleEntry: 0
		})
	);
	return race;
}

export function restoreStraightGuide(race) {
	const y = race.layout.finale.start,
		slope = 328 / 400;
	const offsetX = 6 / Math.sqrt(1 + slope * slope),
		offsetY = -offsetX * slope;
	const joinY = y + 400 + offsetY - (6 - offsetX) / slope;
	const x1 = 12 - offsetX,
		y1 = y + offsetY,
		x2 = 334,
		y2 = joinY;
	for (const side of [-1, 1]) {
		const chute = race.blocks.find((b) => b.id === `chute-${side}`);
		Object.assign(chute, {
			y: (joinY + race.layout.height) / 2,
			w: race.layout.height - joinY + 12
		});
		const index = race.blocks.findIndex((b) => b.id === `finale-guide-${side}`);
		const reflected = side === 1;
		race.blocks[index] = makeBlock(
			'wall',
			reflected ? 720 - (x1 + x2) / 2 : (x1 + x2) / 2,
			(y1 + y2) / 2,
			{
				id: `finale-guide-${side}`,
				w: Math.hypot(x2 - x1, y2 - y1) + 12,
				h: 12,
				angle: reflected ? Math.PI - Math.atan2(y2 - y1, x2 - x1) : Math.atan2(y2 - y1, x2 - x1),
				zoneId: 'finale',
				soundType: 'rubber',
				deviceId: 'finale-guide',
				extendEnds: true,
				friction: 0,
				cornerRadius: 6
			}
		);
	}
}
