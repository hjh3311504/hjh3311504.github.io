// 경기 시간과0.25배속을 합산한 재생 시간을 분리한다. CPU 실행 시간은 별도다.
import { createRace, stepRace, STEP } from '../src/lib/marble-race/physics.js';
import { createDirector, FINALE_SPEED } from '../src/lib/marble-race/director.js';
import { MAPS } from '../src/lib/marble-race/catalog.js';
const large = process.argv.includes('--large');
const counts = large ? [300, 1000] : [2, 10, 20, 30, 60, 100];
const seedCount = large ? 1 : 10;
for (const map of MAPS)
	for (const count of counts)
		for (let seed = 1; seed <= seedCount; seed++) {
			const cpuStart = performance.now();
			const race = createRace(Array(count).fill('공'), map, seed);
			const modes = [
				['first', 1],
				['multiple', Math.min(3, count)],
				['nth', Math.ceil(count / 2)],
				['last', 1]
			];
			const clocks = modes.map(([mode, n]) => ({
				mode,
				director: createDirector(mode, n),
				state: null,
				seconds: 0,
				won: null
			}));
			for (const c of clocks) c.state = c.director.update(race);
			const limit = large ? 600 : 120;
			while (race.time < limit && race.finished.length < count) {
				for (const c of clocks)
					if (c.won === null) c.seconds += STEP / (c.state.active ? FINALE_SPEED : 1);
				stepRace(race);
				for (const c of clocks)
					if (c.won === null) {
						c.state = c.director.update(race);
						if (c.state.complete) c.won = +c.seconds.toFixed(3);
					}
			}
			console.log(
				JSON.stringify({
					map: map.id,
					count,
					seed,
					rows: race.layout.tileRows,
					finished: race.finished.length,
					gameSeconds: +race.time.toFixed(3),
					cpuSeconds: +((performance.now() - cpuStart) / 1000).toFixed(3),
					winnerSeconds: Object.fromEntries(clocks.map((c) => [c.mode, c.won]))
				})
			);
		}
