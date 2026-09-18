// 실행: node scripts/measure_marble_race.js > output/marble-measurements.json
// 기본90경기는120초·결승15초 목표로 관측한다. --large는600초까지 관측한다.
import { performance } from 'node:perf_hooks';
const large = process.argv.includes('--large');
import { MAPS } from '../src/lib/marble-race/catalog.js';
import { createRace, stepRace } from '../src/lib/marble-race/physics.js';
const seeds = [5, 47, 999, 1, 2, 3, 17, 29, 81, 2026];
const rows = [];
for (const map of large ? MAPS.slice(0, 1) : MAPS)
	for (const n of large ? [2, 30, 60, 100, 300, 1000] : [2, 30, 60])
		for (const seed of large ? [47] : seeds) {
			const started = performance.now();
			const race = createRace(Array(n).fill('구슬'), map.id, seed);
			while (race.time < (large ? 600 : 120) && race.finished.length < n) stepRace(race);
			rows.push({
				map: map.id,
				wallSeconds: (performance.now() - started) / 1000,
				n,
				seed,
				time: race.time,
				finished: race.finished.length,
				dwell: Math.max(...race.finished.map((m) => m.finishTime - m.finaleEntry)),
				marbles: race.marbles.map((m) => ({
					id: m.id,
					finish: m.finishTime,
					finale: m.finaleEntry,
					pass: m.scatterPassages.get('connector-0'),
					passages: Object.fromEntries(m.scatterPassages),
					zone: m.zoneEntries.get(
						race.zones.find((zone) => zone.y > race.layout.connectors[0].end).id
					),
					span: m.materialTravel.maxX - m.materialTravel.minX
				}))
			});
		}
process.stdout.write(JSON.stringify(rows, null, 2) + '\n');
