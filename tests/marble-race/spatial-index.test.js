import test from 'node:test';
import assert from 'node:assert/strict';
import {
	makeBlock,
	createSpatialIndex,
	nearbyBlocks,
	collision,
	blockAngle,
	shuttleState
} from '../../src/lib/marble-race/physics.js';

test('긴 고정 블록은 떨어진 구슬의 충돌 후보에서 제외하고 실제 접촉은 유지한다', () => {
	for (const angle of [0, Math.PI / 2]) {
		const block = makeBlock('wall', 360, 360, { w: 600, h: 12, angle });
		const index = createSpatialIndex([block]);
		const far = angle === 0 ? { x: 360, y: 480, r: 13 } : { x: 480, y: 360, r: 13 };
		assert.deepEqual(nearbyBlocks(index, far), []);
		const touching = angle === 0 ? { x: 360, y: 378, r: 13 } : { x: 378, y: 360, r: 13 };
		assert.ok(collision(touching, block, 0));
		assert.deepEqual(nearbyBlocks(index, touching), [block]);
	}
});

test('고정·회전·왕복·공전·원호 블록의 실제 접촉은 격자 후보에 모두 포함한다', () => {
	const blocks = [
		...[-Math.PI / 3, 0, Math.PI / 6, Math.PI / 2].map((angle) =>
			makeBlock('wall', 360, 360, { w: 180, h: 12, angle, cornerRadius: 5 })
		),
		makeBlock('rotor', 360, 360, { w: 180, h: 12 }),
		makeBlock('seesaw', 360, 360, { w: 180, h: 12 }),
		makeBlock('wall', 360, 360, {
			w: 120,
			h: 12,
			motion: { originX: 360, amplitude: 80, period: 4, phase: 0, direction: 1 }
		}),
		makeBlock('rotor', 360, 360, { w: 100, h: 12, pivotX: 360, pivotY: 360, orbitRadius: 80 }),
		makeBlock('wall', 360, 360, {
			w: 180,
			h: 180,
			arc: { radius: 80, thickness: 12, start: 0, sweep: Math.PI, period: 4, direction: 1 }
		})
	];
	const index = createSpatialIndex(blocks);
	for (const time of [0, 0.5, 1, 2, 3]) {
		for (const block of blocks) {
			if (block.type === 'seesaw') block.tilt = time;
			if (block.motion) block.x = shuttleState(block, time).x;
			if (block.orbitRadius) {
				const angle = blockAngle(block, time);
				block.x = block.pivotX + Math.cos(angle) * block.orbitRadius;
				block.y = block.pivotY + Math.sin(angle) * block.orbitRadius;
			}
		}
		for (let x = 168; x <= 552; x += 8)
			for (let y = 168; y <= 552; y += 8) {
				const marble = { x, y, r: 13 };
				const candidates = nearbyBlocks(index, marble);
				for (const block of blocks)
					if (collision(marble, block, time))
						assert.ok(candidates.includes(block), JSON.stringify({ marble, block, time }));
			}
	}
});
