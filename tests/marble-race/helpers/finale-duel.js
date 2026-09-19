import { createRace } from '../../../src/lib/marble-race/physics.js';

// 선두가30만큼 앞선 같은 진입 상태를 사용해 입구 배치의 차이만 비교한다.
export function createFinaleDuel({ previous = false, phase = Math.PI / 8, side = -1 } = {}) {
	const race = createRace(['선두', '추격'], 'keyboard', 47);
	const bar = race.blocks.find((block) => block.id === 'finale-bar');
	if (previous) {
		Object.assign(bar, { x: 290, y: race.layout.finale.start + 400, w: 180 });
		race.layout.finale.rotor = { x: bar.x, y: bar.y };
	}
	bar.phase = phase;
	race.marbles.forEach((marble, index) =>
		Object.assign(marble, {
			x: 360 + side * (index === 0 ? -35 : 35),
			y: race.layout.finale.mouthY - (index === 0 ? 45 : 75),
			vx: 0,
			vy: 150,
			finaleEntry: 0
		})
	);
	return race;
}
