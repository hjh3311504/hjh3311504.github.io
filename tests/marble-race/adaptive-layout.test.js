import test from 'node:test';
import assert from 'node:assert/strict';
import {
	createRace,
	tilesInView,
	tileRowsForCount,
	collision,
	hitBlock,
	stepRace
} from '../../src/lib/marble-race/physics.js';
import { MAPS } from '../../src/lib/marble-race/catalog.js';

test('인원별 줄 수가 일반층·특수 구간·결승에 함께 반영되고30명은960개를 유지한다', () => {
	for (const map of MAPS)
		for (const [count, rows] of [
			[2, 4],
			[10, 7],
			[20, 10],
			[30, 12],
			[60, 17],
			[100, 22],
			[300, 38],
			[1000, 69]
		]) {
			const race = createRace(Array(count).fill('공'), map, 47);
			assert.equal(tileRowsForCount(count), rows);
			assert.equal(race.layout.tileRows, rows);
			assert.equal(race.blocks.filter((b) => b.tile).length, rows * 80);
			for (const zone of race.zones) {
				assert.equal(zone.rows, rows);
				assert.equal(zone.end - zone.start, rows * 34);
				assert.equal(race.blocks.filter((b) => b.tile && b.zoneId === zone.id).length, rows * 20);
			}
			for (let i = 0; i < 3; i++) {
				assert.equal(race.layout.connectors[i].start, race.zones[i].end);
				assert.equal(race.zones[i + 1].start, race.layout.connectors[i].end);
			}
			assert.ok(race.layout.finish.y > race.zones.at(-1).end);
		}
});

test('소수 구슬만 표시하는 미리보기에도 실제 인원의 전체 배치를 사용한다', () => {
	const preview = createRace(['가', '나'], 'keyboard', 47, { layoutCount: 1000 });
	assert.equal(preview.marbles.length, 2);
	assert.deepEqual(preview.layout, createRace(Array(1000).fill('공'), 'keyboard', 47).layout);
	assert.equal(preview.blocks.filter((b) => b.tile).length, 5520);
});

test('왁스는 중앙 방향으로 기울고 압축·복구 때 회전된 구슬 겹침을 확인한다', () => {
	for (const side of [0, 4]) {
		const race = createRace(Array(30).fill('공'), 'keyboard');
		const wax = race.blocks.filter((b) => b.type === 'butter');
		for (const b of wax) assert.equal(b.angle, ((b.x > 360 ? -1 : 1) * Math.PI) / 6);
		const block = wax[side],
			marble = race.marbles[0];
		race.blocks = [block];
		race.marbles = race.marbles.slice(0, 1);
		const angle = block.angle;
		const touch = () => {
			const distance = block.h / 2 + 12.8;
			Object.assign(marble, {
				x: block.x + Math.sin(angle) * distance,
				y: block.y - Math.cos(angle) * distance,
				vx: -Math.sin(angle) * 200,
				vy: Math.cos(angle) * 200
			});
			marble.specialContacts.clear();
			hitBlock(race, marble, block, collision(marble, block, race.time));
		};
		for (let i = 0; i < 5; i++) touch();
		assert.equal(block.alive, false);
		Object.assign(marble, { x: block.x, y: block.y, vx: 0, vy: 0 });
		marble.held = { kind: 'frost', until: 5, blockId: block.id, x: marble.x, y: marble.y };
		while (race.time < 3.1) stepRace(race);
		assert.equal(block.alive, false);
		marble.held = null;
		marble.y = block.y + 250;
		stepRace(race);
		assert.equal(block.alive, true);
		assert.equal(block.h, 64);
		assert.equal(block.angle, angle);
	}
});

test('대규모 준비 화면은 전체 높이와 탐색한 구역의 실제 타일 위치를 유지한다', () => {
	const race = createRace(['공', '공'], 'keyboard', 2, { layoutCount: 1000000, preview: true });
	assert.equal(race.layout.tileRows, 2191);
	assert.equal(race.blocks.filter((b) => b.tile).length, 0);
	const zone = race.zones[2];
	const tiles = [...tilesInView(race.layout, zone.y, zone.y + 100)];
	assert.equal(tiles.length, 80);
	assert.ok(tiles.every((b) => b.type === zone.type && b.zoneId === zone.id));
	const full = createRace(['공', '공'], 'keyboard', 2);
	assert.deepEqual(
		[...tilesInView(full.layout)],
		full.blocks.filter((b) => b.tile)
	);
});
