import { createMarbleGrid } from './marble-grid.js';
import { solveFinaleContacts } from './finale-contacts.js';
import { constrainFinaleMotion } from './finale-boundary.js';
import { createSkills, updateSkills, applyGusts, GUST_SPEED } from './skills.js';
import { BLOCKS, MARBLE_COLORS, BREAKABLE_TYPES, resolveMap } from './catalog.js';

export const WIDTH = 720;
export const TILE_ROWS = 12;
export const BLOCK_SCALE_LIMIT = 100;
const TILE_PITCH = 34;
const FIRST_LAYER_Y = 300;
const SPECIAL_HEIGHT = 960;
const PIN_SECTION_HEIGHT = 260;
const CONNECTOR_HEIGHT = SPECIAL_HEIGHT + PIN_SECTION_HEIGHT;
// 재생성을 다시 시험할 수 있도록 기존 복구 로직은 보존한다.
const BLOCK_RESPAWN_ENABLED = false;
export const RESPAWN_DELAY = 3;
const FINALE_HEIGHT = 740;
export const STEP = 1 / 120;
const RADIUS = 13;
const MARBLE_RESTITUTION = 0.8;
const LARGE_RACE_SIZE = 200;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function randomGenerator(seed) {
	let value = seed >>> 0;
	return () => {
		value += 0x6d2b79f5;
		let t = Math.imul(value ^ (value >>> 15), 1 | value);
		t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function makeBlock(type, x, y, options = {}) {
	return {
		id: `${type}-${x}-${y}`,
		type,
		x,
		y,
		w: 94,
		h: 26,
		angle: 0,
		hp: 1,
		alive: true,
		flash: 0,
		respawnAt: null,
		breakCycle: 0,
		tilt: 0,
		phase: 0,
		direction: 1,
		...options
	};
}

export function butterHitCount(participantCount) {
	return Math.max(1, Math.round(5 * Math.sqrt(participantCount / 30)));
}

export function tileRowsForCount(participantCount) {
	return Math.max(
		4,
		Math.round(TILE_ROWS * Math.sqrt(Math.min(participantCount, BLOCK_SCALE_LIMIT) / 30))
	);
}

export function createLayout(mapId, participantCount = 30) {
	const map = resolveMap(mapId);
	const tileRows = tileRowsForCount(participantCount);
	const zones = [],
		connectors = [];
	let y = Math.max(FIRST_LAYER_Y, 70 + (Math.ceil(participantCount / 26) - 1) * 40 + 90);
	for (const [index, type] of map.layers.entries()) {
		const zone = {
			id: `layer-${index}`,
			type,
			rows: tileRows,
			y,
			start: y - 16,
			end: y + tileRows * TILE_PITCH - 16
		};
		zones.push(zone);
		y += tileRows * TILE_PITCH;
		if (index < map.layers.length - 1) {
			connectors.push({
				id: `connector-${connectors.length}`,
				zoneId: zone.id,
				start: y - 16,
				end: y + CONNECTOR_HEIGHT - 16,
				kind: ['frost', 'butter', 'pond'][index],
				pinStart: y - 16 + PIN_SECTION_HEIGHT + 238,
				pinRowGap: 50,
				specialStart: y - 16 + PIN_SECTION_HEIGHT
			});
			y += CONNECTOR_HEIGHT;
		}
	}
	const finalApproach = {
		id: 'finale-approach',
		kind: 'scatter',
		start: y,
		end: y + 320,
		pinStart: y + 30
	};
	y = finalApproach.end;
	return {
		participantCount,
		tileRows,
		finalApproach,
		zones,
		connectors,

		finale: {
			id: 'finale',
			start: y,
			end: y + FINALE_HEIGHT,
			guideStartY: y + 400 - 328 * Math.tan((40 * Math.PI) / 180),
			rightGuideStartY: y + 400 - 328 * Math.tan((30 * Math.PI) / 180),
			mouthY: y + 400,
			rotor: { x: 160, y: y + 480 }
		},
		finish: { y: y + FINALE_HEIGHT - 30, left: 340, right: 380 },
		height: y + FINALE_HEIGHT
	};
}
// 기존 계산 호출처를 위한 기본 맵의 판정선. 실제 경기는 layout.finish를 사용한다.
export const FINISH_Y = createLayout('crunch').finish.y;

export function createZones(mapId) {
	return createLayout(mapId).zones;
}
function wallBetween(id, x1, y1, x2, y2, width = 14, options = {}) {
	return makeBlock('wall', (x1 + x2) / 2, (y1 + y2) / 2, {
		id,
		w: Math.hypot(x2 - x1, y2 - y1) + (options.extendEnds ? width : 0),
		h: width,
		angle: Math.atan2(y2 - y1, x2 - x1),
		...options
	});
}
function addScatterPins(blocks, section) {
	for (const [row, xs, offset] of [
		[0, [192, 304, 416, 528], 58],
		[1, [136, 248, 360, 472, 584], 150],
		[2, [192, 304, 416, 528], 212]
	])
		for (const x of xs)
			blocks.push(
				makeBlock(
					'rubber',
					x,
					section.pinStart + (section.pinRowGap ? 58 + row * section.pinRowGap : offset),
					{
						id: `${section.id}-pin-${row}-${x}`,
						connectorId: section.id,
						zoneId: section.id,
						deviceId: `${section.id}-pins`,
						soundType: 'rubber',
						pin: true,
						w: 32,
						h: 32,
						cornerRadius: 16,
						restitution: 0.45,
						friction: 0.02
					}
				)
			);
}
// 준비 화면은 전체 배치를 유지하되 현재 보이는 줄만 만든다.
export function* tilesInView(layout, top = -Infinity, bottom = Infinity) {
	for (const zone of layout.zones) {
		const first = Math.max(0, Math.ceil((top - zone.y - 16) / TILE_PITCH));
		const last = Math.min(zone.rows - 1, Math.floor((bottom - zone.y + 16) / TILE_PITCH));
		for (let row = first; row <= last; row++)
			for (let col = 0; col < 20; col++)
				yield makeBlock(zone.type, 37 + col * 34 + (row % 2 ? 8 : -8), zone.y + row * 34, {
					id: `${zone.id}-${row}-${col}`,
					zoneId: zone.id,
					tile: true,
					w: 32,
					h: 32,
					cornerRadius: 10
				});
	}
}
export function createMap(
	mapId,
	random = randomGenerator(1),
	layout = createLayout(mapId),
	options = {}
) {
	const blocks = options.preview ? [] : [...tilesInView(layout)];
	for (const connector of layout.connectors) {
		const { id, specialStart: start, kind } = connector;
		const common = { connectorId: id, zoneId: id, deviceId: id };
		for (const side of [-1, 1])
			blocks.push(
				wallBetween(
					`${id}-guide-${side}`,
					360 + side * 348,
					start + 35,
					360 + side * 246,
					start + 145,
					14,
					{ ...common, cornerRadius: 7, soundType: 'rubber', friction: 0 }
				)
			);
		if (kind === 'frost') {
			for (const [index, x, offset, direction] of [
				[0, 130, 530, 1],
				[1, 360, 530, 1],
				[2, 590, 530, -1],
				[3, 245, 750, 1],
				[4, 475, 750, -1]
			])
				blocks.push(
					makeBlock('frost', x, start + offset, {
						...common,
						id: `${id}-frost-${index}`,
						deviceId: `${id}-frost-${index}`,
						w: 160,
						h: 28,
						angle: (direction * Math.PI) / 6,
						cornerRadius: 8,
						special: true
					})
				);
		} else if (kind === 'butter') {
			for (const [row, xs] of [
				[0, [116, 360, 604]],
				[1, [238, 482]]
			])
				for (const x of xs)
					blocks.push(
						makeBlock('butter', x, start + 480 + row * 220, {
							...common,
							id: `${id}-butter-${row}-${x}`,
							deviceId: `${id}-butter-${row}-${x}`,
							w: 120,
							h: 64,
							baseHeight: 64,
							angle: ((x > WIDTH / 2 ? -1 : 1) * Math.PI) / 6,
							hp: butterHitCount(layout.participantCount),
							maxHp: butterHitCount(layout.participantCount),
							cornerRadius: 16,
							special: true
						})
					);
		} else if (kind === 'pond') {
			connector.bypasses = [
				{ left: 164, right: 284 },
				{ left: 436, right: 556 }
			];
			for (const [position, x] of [
				['left', 88],
				['center', 360],
				['right', 632]
			])
				blocks.push(
					makeBlock('pond', x, start + 630, {
						...common,
						id: `${id}-pond-${position}`,
						deviceId: `${id}-pond-${position}`,
						w: 152,
						h: 140,
						cornerRadius: 0,
						special: true
					})
				);
		}
		addScatterPins(blocks, connector);
	}
	addScatterPins(blocks, layout.finalApproach);
	const finalePhase = random() * Math.PI * 2;
	blocks.push(
		makeBlock('rotor', layout.finale.rotor.x, layout.finale.rotor.y, {
			id: 'finale-bar',
			zoneId: 'finale',
			deviceId: 'finale-bar',
			soundType: 'rubber',
			w: 448,
			h: 16,
			cornerRadius: 8,
			angularSpeed: (Math.PI * 2) / 13.2,
			direction: -1,
			phase: finalePhase,
			restitution: 0.35,
			friction: 0.05
		})
	);
	for (const side of [-1, 1]) {
		// 왼쪽40°·오른쪽30°의 안쪽 면을 폭40 출구에 연결한다.
		const y = side === -1 ? layout.finale.guideStartY : layout.finale.rightGuideStartY;
		const mouthY = layout.finale.mouthY;
		const slope = 328 / (mouthY - y);
		const offsetX = 6 / Math.sqrt(1 + slope * slope);
		const offsetY = -offsetX * slope;
		const joinY = mouthY + offsetY - (6 - offsetX) / slope;
		blocks.push(
			wallBetween(
				`finale-guide-${side}`,
				360 + side * (348 + offsetX),
				y + offsetY,
				360 + side * 26,
				joinY,
				12,
				{
					zoneId: 'finale',
					soundType: 'rubber',
					deviceId: 'finale-guide',
					extendEnds: true,
					friction: 0,
					cornerRadius: 6
				}
			)
		);
		blocks.push(
			wallBetween(`chute-${side}`, 360 + side * 26, joinY, 360 + side * 26, layout.height, 12, {
				zoneId: 'finale',
				soundType: 'rubber',
				deviceId: 'finale-chute',
				silent: true,
				extendEnds: true,
				friction: 0,
				cornerRadius: 6
			})
		);
	}

	return blocks;
}

// 회전·왕복 장치의 전체 이동 범위도 격자에 등록한다.
const CELL = 48;
export function createSpatialIndex(blocks) {
	const cells = new Map();
	blocks.forEach((block, order) => {
		const radius =
			Math.hypot(block.w, block.h) / 2 + (block.orbitRadius ?? 0) + (block.motion?.amplitude ?? 0);
		const centerX = block.motion?.originX ?? block.pivotX ?? block.x,
			centerY = block.pivotY ?? block.y;
		for (
			let y = Math.floor((centerY - radius) / CELL);
			y <= Math.floor((centerY + radius) / CELL);
			y++
		)
			for (
				let x = Math.floor((centerX - radius) / CELL);
				x <= Math.floor((centerX + radius) / CELL);
				x++
			) {
				let row = cells.get(y);
				if (!row) cells.set(y, (row = new Map()));
				let cell = row.get(x);
				if (!cell) row.set(x, (cell = []));
				cell.push(order);
			}
	});
	return { blocks, cells };
}
const blockQueryScratch = new WeakMap();
export function nearbyBlocks(index, marble, result = []) {
	let scratch = blockQueryScratch.get(index);
	if (!scratch) {
		scratch = { seen: new Uint32Array(index.blocks.length), stamp: 0, orders: [] };
		blockQueryScratch.set(index, scratch);
	}
	if (++scratch.stamp === 0xffffffff) {
		scratch.seen.fill(0);
		scratch.stamp = 1;
	}
	const { seen, stamp, orders } = scratch;
	orders.length = 0;
	result.length = 0;
	for (
		let y = Math.floor((marble.y - marble.r) / CELL);
		y <= Math.floor((marble.y + marble.r) / CELL);
		y++
	) {
		const row = index.cells.get(y);
		if (!row) continue;
		for (
			let x = Math.floor((marble.x - marble.r) / CELL);
			x <= Math.floor((marble.x + marble.r) / CELL);
			x++
		)
			for (const order of row.get(x) ?? []) {
				if (seen[order] === stamp) continue;
				seen[order] = stamp;
				orders.push(order);
			}
	}
	orders.sort((a, b) => a - b);
	for (const order of orders) result.push(index.blocks[order]);
	return result;
}
export function followedMarble(race, mode, focusId) {
	let selected, candidate;
	for (const marble of race.marbles) {
		if (marble.finished) continue;
		if (marble.id === Number(focusId)) selected = marble;
		if (
			!candidate ||
			(mode === 'last' ? marble.y < candidate.y : marble.y > candidate.y) ||
			(marble.y === candidate.y && marble.id < candidate.id)
		)
			candidate = marble;
	}
	return selected ?? candidate;
}
export function* prepareRace(participants, mapId = 'crunch', seed = 1, options = {}) {
	const names = [];
	if (Array.isArray(participants)) {
		for (const name of participants) {
			names.push(name);
			if (names.length % 256 === 0) yield { phase: 'names', count: names.length };
		}
	} else
		for (const entry of participants.entries)
			for (let i = 0; i < entry.count; i++) {
				names.push(entry.name);
				if (names.length % 256 === 0) yield { phase: 'names', count: names.length };
			}
	if (names.length < 2) throw new Error('구슬은2개 이상이어야 합니다.');
	const random = randomGenerator(seed);
	const layout = createLayout(mapId, options.layoutCount ?? names.length),
		blocks = createMap(mapId, random, layout, options);
	const positions = [];
	const total = options.layoutCount ?? names.length;
	const columns = Math.min(26, total);
	// 필요한 자리만 뽑아 큰 명단의 미리보기도 실제 경기와 같은 배치를 사용한다.
	const remainingSlots = new Map();
	for (let i = 0; i < names.length; i++) {
		const picked = i + Math.floor(random() * (total - i));
		const slot = remainingSlots.get(picked) ?? picked;
		remainingSlots.set(picked, remainingSlots.get(i) ?? i);
		remainingSlots.delete(i);
		const row = Math.floor(slot / columns),
			col = slot % columns;
		const rowCount = Math.min(columns, total - row * columns);
		const inset = columns <= 24 ? 60 : 25;
		positions.push({
			x: rowCount === 1 ? WIDTH / 2 : inset + (col * (WIDTH - 2 * inset)) / (rowCount - 1),
			y: 70 + row * 40,
			r: RADIUS
		});
		if (i % 256 === 0) yield { phase: 'positions', count: i };
	}
	const marbles = [];
	for (let index = 0; index < names.length; index++) {
		const name = names[index];
		const marble = {
			id: index,
			name,
			color: MARBLE_COLORS[index % MARBLE_COLORS.length],
			...positions[index],
			vx: 0,
			vy: 0,
			held: null,
			finished: false,
			finishTime: null,
			windUntil: 0,
			windDirection: random() < 0.5 ? -1 : 1
		};
		// 준비 화면에는 접촉 기록과 물리 계산용 Map·Set을 만들지 않는다.
		if (!options.preview)
			Object.assign(marble, {
				contacts: new Map(),
				ignored: new Map(),
				bestY: 0,
				lastProgress: 0,
				pinRest: null,
				pulseBoostUntil: 0,
				scatterPassages: new Map(),
				brokenPositions: new Set(),
				zoneEntries: new Map(),
				finaleEntry: null,
				specialContacts: new Set(),
				materialTravel: null,
				trail: []
			});
		marbles.push(marble);
		if (index % 256 === 0) yield { phase: 'marbles', count: index };
	}
	return {
		preview: Boolean(options.preview),
		skills: createSkills(seed, Boolean(options.skillsEnabled)),
		marbles,
		blocks,
		zones: layout.zones,
		respawnQueue: [],
		layout,
		time: 0,
		finaleRotorContacts: new Map(),
		finished: [],
		events: [],
		seed,
		map: resolveMap(mapId)
	};
}

export function createRace(names, mapId = 'crunch', seed = 1, options = {}) {
	const iterator = prepareRace(names, mapId, seed, options);
	let result = iterator.next();
	while (!result.done) result = iterator.next();
	return result.value;
}

export function shuttleState(block, time) {
	const motion = block.motion;
	const omega = ((Math.PI * 2) / motion.period) * motion.direction;
	const angle = time * omega + motion.phase;
	return {
		x: motion.originX + Math.sin(angle) * motion.amplitude,
		vx: Math.cos(angle) * motion.amplitude * omega
	};
}

export function arcMotion(block, time) {
	const arc = block.arc;
	if (!arc.period) return { angle: 0, omega: 0 };
	const omega = (Math.PI * 2 * arc.direction) / arc.period;
	return { angle: (arc.phase ?? 0) + time * omega, omega };
}
export function arcStart(block, time) {
	return block.arc.start + arcMotion(block, time).angle;
}

export function blockAngle(block, time) {
	if (block.type === 'rotor')
		return time * (block.angularSpeed ?? 1.7) * block.direction + block.phase;
	if (block.type === 'seesaw') return block.tilt;
	return block.angle;
}

export function gateOpen(block, time) {
	return (time + block.phase) % 5.2 > 2.8;
}

const collisionGeometry = new WeakMap();
function shapeGeometry(block, time) {
	const angle = blockAngle(block, time),
		corner = Math.min(block.cornerRadius ?? 0, block.w / 2, block.h / 2);
	let g = collisionGeometry.get(block);
	if (g && g.angle === angle && g.w === block.w && g.h === block.h && g.corner === corner) return g;
	g = {
		angle,
		w: block.w,
		h: block.h,
		corner,
		c: Math.cos(angle),
		s: Math.sin(angle),
		halfW: block.w / 2 - corner,
		halfH: block.h / 2 - corner
	};
	collisionGeometry.set(block, g);
	return g;
}
// 구슬 중심을 블록의 로컬 좌표로 옮겨 충돌면을 계산한다.
export function collision(marble, block, time, geometry) {
	if (block.arc) {
		const arc = block.arc,
			start = arcStart(block, time);
		const dx = marble.x - block.x,
			dy = marble.y - block.y;
		const angle = Math.atan2(dy, dx),
			tau = Math.PI * 2;
		const relative = (((angle - start) % tau) + tau) % tau;
		let closest = angle;
		if (relative > arc.sweep)
			closest = relative - arc.sweep < tau - relative ? start + arc.sweep : start;
		const px = block.x + Math.cos(closest) * arc.radius,
			py = block.y + Math.sin(closest) * arc.radius;
		const distance = Math.hypot(marble.x - px, marble.y - py),
			depth = marble.r + arc.thickness / 2 - distance;
		if (depth <= 0) return null;
		return {
			nx: distance > 0.0001 ? (marble.x - px) / distance : -Math.cos(closest),
			ny: distance > 0.0001 ? (marble.y - py) / distance : -Math.sin(closest),
			depth,
			px,
			py
		};
	}

	// 수평·수직 기본 블록의 바깥 상자에도 닿지 않으면 회전 좌표와 둥근 모서리를 계산하지 않는다.
	// 경계의 반올림 차이는 정밀 판정으로 넘긴다.
	if (
		!geometry &&
		block.angle === 0 &&
		block.type !== 'rotor' &&
		block.type !== 'seesaw' &&
		(Math.abs(marble.x - block.x) > block.w / 2 + marble.r + 1e-9 ||
			Math.abs(marble.y - block.y) > block.h / 2 + marble.r + 1e-9)
	)
		return null;

	geometry ??= shapeGeometry(block, time);
	const { c, s } = geometry;
	const dx = marble.x - block.x,
		dy = marble.y - block.y;
	const lx = dx * c + dy * s,
		ly = -dx * s + dy * c;
	const { corner, halfW, halfH } = geometry;
	// 바깥 사각형에도 닿지 않으면 거리 계산이 필요 없다.
	if (Math.abs(lx) > halfW + marble.r + corner || Math.abs(ly) > halfH + marble.r + corner)
		return null;
	const px = clamp(lx, -halfW, halfW),
		py = clamp(ly, -halfH, halfH);
	let nx = lx - px,
		ny = ly - py;
	const distance = nx === 0 ? Math.abs(ny) : ny === 0 ? Math.abs(nx) : contactDistance(nx, ny);
	if (distance >= marble.r + corner) return null;
	let depth = marble.r + corner - distance;
	if (distance < 0.0001) {
		const gapX = halfW - Math.abs(lx),
			gapY = halfH - Math.abs(ly);
		if (gapX < gapY) {
			nx = lx < 0 ? -1 : 1;
			ny = 0;
			depth = marble.r + corner + gapX;
		} else {
			nx = 0;
			ny = ly < 0 ? -1 : 1;
			depth = marble.r + corner + gapY;
		}
	} else {
		nx /= distance;
		ny /= distance;
	}
	return { nx: nx * c - ny * s, ny: nx * s + ny * c, depth };
}

function emit(race, block, marble, broken = false, impact = 100, contact = null) {
	block.flash = race.time;
	race.events.push({
		type: block.type,
		soundType: block.soundType ?? block.type,
		silent: block.silent ?? false,
		deviceId: block.deviceId ?? block.id,
		impact,
		zoneId: block.zoneId,
		blockId: block.id,
		x: contact?.x ?? marble.x,
		y: contact?.y ?? marble.y,
		broken,
		breakCycle: block.breakCycle,
		time: race.time,
		id: marble.id
	});
}

// 접촉면을 따라 미끄러지는 속도는 마찰 충격량만큼 줄인다.
export function bounce(marble, hit, restitution = 0.42, friction = 0, surface = { vx: 0, vy: 0 }) {
	marble.x += hit.nx * (hit.depth + 0.001);
	marble.y += hit.ny * (hit.depth + 0.001);
	const vx = marble.vx - surface.vx,
		vy = marble.vy - surface.vy;
	const normalSpeed = vx * hit.nx + vy * hit.ny;
	if (normalSpeed >= 0) return;
	const impulse = -(1 + restitution) * normalSpeed;
	const tangent = -vx * hit.ny + vy * hit.nx;
	const drag = clamp(tangent, -friction * impulse, friction * impulse);
	marble.vx += impulse * hit.nx + drag * hit.ny;
	marble.vy += impulse * hit.ny - drag * hit.nx;
}

function destroyBlock(race, marble, block, impact, contact = null) {
	block.hp = 0;
	block.alive = false;
	block.breakCycle++;
	if (!marble.brokenPositions.has(block.id)) {
		marble.brokenPositions.add(block.id);
		marble.lastProgress = race.time;
	}
	if (BLOCK_RESPAWN_ENABLED) {
		block.respawnAt = race.time + RESPAWN_DELAY;
		const queue = race.respawnQueue;
		let lo = 0,
			hi = queue.length;
		while (lo < hi) {
			const mid = (lo + hi) >>> 1,
				other = queue[mid];
			if (
				other.respawnAt < block.respawnAt ||
				(other.respawnAt === block.respawnAt && (other.order ?? 0) <= (block.order ?? 0))
			)
				lo = mid + 1;
			else hi = mid;
		}
		queue.splice(lo, 0, block);
	}
	emit(race, block, marble, true, impact, contact);
}

export function hitBlock(race, marble, block, hit, dt = STEP) {
	if (!block.alive || !hit) return;
	if (
		block.id === 'finale-bar' &&
		!marble.finished &&
		(!marble.held || marble.held.kind === 'lightning')
	)
		race.finaleRotorContacts.set(marble, race.time);
	const contactId = block.deviceId ?? block.id;
	const lastHit = marble.contacts.get(contactId) ?? -100;
	const fresh = race.time - lastHit > 0.22;
	if (block.type === 'gate' && gateOpen(block, race.time)) return;
	if (block.connectorId && dt > 0) {
		let record = marble.scatterPassages.get(block.connectorId);
		if (!record) {
			record = { contacts: [], entry: null, exit: null };
			marble.scatterPassages.set(block.connectorId, record);
		}
		if (!record.contacts.some((contact) => contact.blockId === block.id))
			record.contacts.push({ blockId: block.id, time: race.time, x: marble.x, y: marble.y });
	}
	if (block.type === 'pond') {
		if (dt <= 0) return;
		marble.vx *= Math.exp(-dt * 2);
		marble.vy *= Math.exp(-dt * 5.25);
		if (!marble.specialContacts.has(block.id)) {
			marble.specialContacts.add(block.id);
			emit(race, block, marble);
		}
		return;
	}
	if (block.type === 'frost') {
		const impact = Math.max(0, -(marble.vx * hit.nx + marble.vy * hit.ny));
		// 풀린 뒤에도 표면 충돌을 유지한다. 접촉이 이어지는 동안에는 다시 얼리지 않는다.
		bounce(marble, hit, 0, 0.01);
		if (dt <= 0 || marble.specialContacts.has(block.id)) return;
		// 이미 얼어붙은 구슬과 겹친 자리에는 고정하지 않고 구슬 충돌로 먼저 분리한다.
		if (
			race.marbles.some(
				(other) =>
					other !== marble &&
					!other.finished &&
					other.held &&
					Math.hypot(other.x - marble.x, other.y - marble.y) < other.r + marble.r
			)
		)
			return;
		marble.specialContacts.add(block.id);
		marble.held = {
			kind: 'frost',
			until: race.time + 1,
			blockId: block.id,
			x: marble.x,
			y: marble.y
		};
		marble.vx = marble.vy = 0;
		emit(race, block, marble, false, impact);
		return;
	}
	if (block.type === 'butter') {
		const impact = Math.max(0, -(marble.vx * hit.nx + marble.vy * hit.ny));
		const freshContact = !marble.specialContacts.has(block.id);
		bounce(marble, hit, 0.35, 0.25);
		if (!freshContact || dt <= 0 || impact <= 0) return;
		marble.specialContacts.add(block.id);
		const contact = { x: marble.x - hit.nx * marble.r, y: marble.y - hit.ny * marble.r };
		// 약한 접촉도 소리를 내되, 손상 기준과 지속 접촉 중복 방지는 유지한다.
		if (impact >= 5) block.hp--;
		if (block.hp === 0) destroyBlock(race, marble, block, impact, contact);
		else {
			block.h = block.baseHeight * (0.45 + (0.55 * block.hp) / (block.maxHp ?? 5));
			emit(race, block, marble, false, impact, contact);
		}
		return;
	}
	if (block.type === 'gel' || block.type === 'wind') {
		if (block.type === 'gel') {
			marble.vx *= Math.exp(-dt * 7);
			marble.vy = Math.min(marble.vy, 55);
		} else {
			marble.vx += Math.sin(race.time * 3 + block.phase) * 28 * dt;
			marble.vy -=
				(80 + Math.sin(race.time * 4 + block.phase) * 45 + 0.14 * marble.vy * Math.abs(marble.vy)) *
				dt;
		}
		if (race.time - lastHit > 0.65) {
			emit(race, block, marble);
			marble.contacts.set(block.id, race.time);
		}
		return;
	}
	if (BREAKABLE_TYPES.includes(block.type)) {
		const material = BLOCKS[block.type];
		const impact = Math.max(0, -(marble.vx * hit.nx + marble.vy * hit.ny));
		bounce(marble, hit, material.restitution, material.friction);
		destroyBlock(race, marble, block, impact, {
			x: marble.x - hit.nx * marble.r,
			y: marble.y - hit.ny * marble.r
		});
		return;
	}
	if (block.type === 'sticky') {
		if (marble.ignored.has(block.id)) return;
		marble.held = { until: race.time + 1, blockId: block.id, x: marble.x, y: marble.y };
		marble.vx = 0;
		marble.vy = 0;
		marble.ignored.set(block.id, true);
		emit(race, block, marble);
		marble.contacts.set(block.id, race.time);
		return;
	}
	let surface = { vx: block.motion ? shuttleState(block, race.time).vx : 0, vy: 0 };
	if (block.arc?.period) {
		const { omega } = arcMotion(block, race.time);
		surface = { vx: -omega * (hit.py - block.y), vy: omega * (hit.px - block.x) };
	}
	if (block.type === 'rotor') {
		const omega = (block.angularSpeed ?? 1.7) * block.direction;
		surface = {
			vx: -omega * (marble.y - hit.ny * marble.r - (block.pivotY ?? block.y)),
			vy: omega * (marble.x - hit.nx * marble.r - (block.pivotX ?? block.x))
		};
	}
	const impact = Math.max(
		0,
		-((marble.vx - surface.vx) * hit.nx + (marble.vy - surface.vy) * hit.ny)
	);
	bounce(
		marble,
		hit,
		block.restitution ??
			(block.type === 'rubber'
				? 0.95
				: block.type === 'slide' || block.type === 'wall'
					? 0.05
					: 0.35),
		block.friction ?? (block.type === 'slide' || block.type === 'wall' ? 0.015 : 0.12),
		surface
	);
	if (block.type === 'seesaw')
		block.tilt = clamp(block.tilt + (marble.x - block.x) * dt * 0.035, -0.48, 0.48);
	if ((block.type === 'wall' && !block.soundType) || !fresh || (block.soundType && impact < 25))
		return;
	marble.contacts.set(contactId, race.time);
	emit(race, block, marble, false, impact, {
		x: marble.x - hit.nx * marble.r,
		y: marble.y - hit.ny * marble.r
	});
	if (block.type === 'spring') {
		marble.vx += hit.nx * 230;
		marble.vy += hit.ny * 230;
	}
}

function constrainWalls(marble) {
	if (marble.x < marble.r + 12) {
		marble.x = marble.r + 12;
		marble.vx = Math.abs(marble.vx) * 0.7;
	}
	if (marble.x > WIDTH - marble.r - 12) {
		marble.x = WIDTH - marble.r - 12;
		marble.vx = -Math.abs(marble.vx) * 0.7;
	}
	if (marble.y < marble.r) {
		marble.y = marble.r;
		marble.vy = Math.abs(marble.vy);
	}
}
function firstContactFraction(marble, block, from, time) {
	if (!from || collision({ x: from.x, y: from.y, r: marble.r }, block, time)) return 0;
	let low = 0,
		high = 1;
	for (let i = 0; i < 10; i++) {
		const middle = (low + high) / 2;
		const probe = {
			r: marble.r,
			x: from.x + (marble.x - from.x) * middle,
			y: from.y + (marble.y - from.y) * middle
		};
		if (collision(probe, block, time)) high = middle;
		else low = middle;
	}
	return high;
}
const nearbyCache = new WeakMap();
function cachedNearbyBlocks(index, marble) {
	const minX = Math.floor((marble.x - marble.r) / CELL),
		maxX = Math.floor((marble.x + marble.r) / CELL),
		minY = Math.floor((marble.y - marble.r) / CELL),
		maxY = Math.floor((marble.y + marble.r) / CELL);
	let cache = nearbyCache.get(marble);
	if (!cache) {
		cache = { blocks: [] };
		nearbyCache.set(marble, cache);
	}
	if (
		cache.index !== index ||
		cache.minX !== minX ||
		cache.maxX !== maxX ||
		cache.minY !== minY ||
		cache.maxY !== maxY
	) {
		Object.assign(cache, { index, minX, maxX, minY, maxY });
		nearbyBlocks(index, marble, cache.blocks);
	}
	return cache.blocks;
}
const blockContactScratch = new WeakMap();
function resolveBlocks(race, marble, dt, from) {
	// 주변 블록이 없는 구간도 경기장·결승 벽의 이동 제한은 그대로 적용한다.
	const initialBlocks =
		marble.y - marble.r >= race.finaleOnlyY
			? race.finaleBlocks
			: cachedNearbyBlocks(race.spatial, marble);
	if (!initialBlocks.length) {
		constrainWalls(marble);
		if (from) constrainFinaleMotion(race, marble, from.x, from.y);
		return;
	}

	let scratch = blockContactScratch.get(race);
	if (!scratch) {
		scratch = { touched: new Set(), candidates: [], pool: [] };
		blockContactScratch.set(race, scratch);
	}
	const { touched, candidates, pool } = scratch;
	touched.clear();
	for (let pass = 0; pass < 3; pass++) {
		let resolved = false;
		candidates.length = 0;
		for (const block of pass === 0
			? initialBlocks
			: marble.y - marble.r >= race.finaleOnlyY
				? race.finaleBlocks
				: cachedNearbyBlocks(race.spatial, marble)) {
			if (!block.alive) continue;
			const hit = collision(marble, block, race.time);
			if (!hit) continue;
			const candidate = pool[candidates.length] ?? (pool[candidates.length] = {});
			candidate.block = block;
			candidate.hit = hit;
			candidates.push(candidate);
		}
		// 닿은 블록이 하나면 접촉 순서를 정하기 위한10회 거리 탐색이 필요 없다.
		if (candidates.length > 1) {
			for (const candidate of candidates)
				candidate.fraction = firstContactFraction(marble, candidate.block, from, race.time);
			candidates.sort((a, b) => a.fraction - b.fraction);
		}
		for (const candidate of candidates) {
			const { block } = candidate;
			if (!block.alive) continue;
			// 하나만 닿았으면 탐색 뒤 위치가 그대로이므로 같은 접촉면을 다시 계산하지 않는다.
			const hit = candidates.length === 1 ? candidate.hit : collision(marble, block, race.time);
			if (!hit) continue;
			// 겹침 보정 중에는 같은 효과장의 힘을 중복 적용하지 않는다.
			if (touched.has(block.id) && ['gel', 'wind', 'sticky', 'pond'].includes(block.type)) continue;
			touched.add(block.id);
			hitBlock(race, marble, block, hit, dt);
			if (marble.held && marble.held.kind !== 'lightning') return;
			if (!['gel', 'wind', 'sticky', 'pond'].includes(block.type)) resolved = true;
		}
		constrainWalls(marble);
		if (!resolved) break;
	}
	if (from) constrainFinaleMotion(race, marble, from.x, from.y);
}
// 경기별 격자와 후보 배열을 재사용한다. 후보 순서는 기존 번호 오름차순을 유지한다.
const marbleContactScratch = new WeakMap();
function separateMarbles(race) {
	const marbles = race.marbles;
	let grid = marbleContactScratch.get(race);
	if (!grid) marbleContactScratch.set(race, (grid = createMarbleGrid()));
	if (!grid.prepare(marbles)) return;
	const { byId, update } = grid;
	for (let i = 0; i < marbles.length; i++) {
		const a = marbles[i];
		if (a.finished) continue;
		const candidates = grid.nearby(a);
		for (const id of candidates) {
			if (id <= a.id) continue;
			const b = byId[id];
			if (b.finished || (a.held && b.held)) continue;
			const dx = b.x - a.x,
				dy = b.y - a.y;
			const radius = a.r + b.r;
			if (Math.abs(dx) >= radius || Math.abs(dy) >= radius) continue;
			const distance = contactDistance(dx, dy);
			if (distance >= a.r + b.r) continue;
			const nx = distance > 0.001 ? dx / distance : 1,
				ny = distance > 0.001 ? dy / distance : 0;
			const ia = a.held ? 0 : 1,
				ib = b.held ? 0 : 1,
				total = ia + ib;
			const ax = a.x,
				ay = a.y,
				bx = b.x,
				by = b.y;
			const finale =
				race.marbles.length >= LARGE_RACE_SIZE &&
				(a.finaleEntry != null ||
					b.finaleEntry != null ||
					a.y + a.r >= race.layout.finale.start ||
					b.y + b.r >= race.layout.finale.start);
			// 결승의 위치 보정은 단계 끝의 연결 접촉 처리에서 한 번 맡는다.
			const overlap = finale ? 0 : Math.min(4, a.r + b.r - distance) / total;
			a.x -= nx * overlap * ia;
			a.y -= ny * overlap * ia;
			b.x += nx * overlap * ib;
			b.y += ny * overlap * ib;
			const speed = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
			if (speed < 0) {
				const impulse = (-speed * (1 + MARBLE_RESTITUTION)) / total;
				a.vx -= impulse * nx * ia;
				a.vy -= impulse * ny * ia;
				b.vx += impulse * nx * ib;
				b.vy += impulse * ny * ib;
			}
			// 결승 쌍은 여기서 속도만 바뀌므로 위치·벽·격자를 다시 확인할 필요가 없다.
			if (!finale) {
				if (!a.held) resolveBlocks(race, a, 0);
				if (!b.held) resolveBlocks(race, b, 0);
				constrainFinaleMotion(race, a, ax, ay);
				constrainFinaleMotion(race, b, bx, by);
				update(a);
				update(b);
			}
		}
	}
}

// 결승의 연결된 접촉은 위치와 닫히는 속도를 함께 풀고 반발·음향은 반복하지 않는다.
export function settleFinaleContacts(race, display = false) {
	if (!display)
		for (const [m, time] of race.finaleRotorContacts) {
			if (m.finished || race.time - time > STEP + 1e-9) race.finaleRotorContacts.delete(m);
		}
	solveFinaleContacts(race, collision, blockAngle, display);
}
// 핀 꼭대기의 작은 반복 반동은 일반8초 정체보다 일찍 해소한다.
function releasePinRest(race, marble) {
	if (
		marble.held ||
		marble.finaleEntry !== null ||
		marble.y >= race.layout.finale.start ||
		marble.windUntil > race.time ||
		Math.hypot(marble.vx, marble.vy) > 4
	) {
		marble.pinRest = null;
		return;
	}
	const pin = cachedNearbyBlocks(race.spatial, marble).find((block) => {
		if (!block.alive || !block.pin) return false;
		const contact = collision({ x: marble.x, y: marble.y, r: marble.r + 0.15 }, block, race.time);
		return contact && contact.ny < -0.98;
	});
	if (!pin) {
		marble.pinRest = null;
		return;
	}
	const rest = marble.pinRest;
	if (!rest || rest.id !== pin.id || Math.hypot(marble.x - rest.x, marble.y - rest.y) > 2) {
		marble.pinRest = { id: pin.id, since: race.time, x: marble.x, y: marble.y };
		return;
	}
	if (race.time - rest.since < 1) return;
	// 이미 기울어진 쪽으로 밀고, 정중앙에서는 경기 난수로 정한 방향을 쓴다.
	const offset = marble.x - pin.x;
	if (Math.abs(offset) > 0.05) marble.windDirection = Math.sign(offset);
	marble.windUntil = race.time + 0.35;
	marble.lastProgress = race.time;
	marble.pinRest = null;
}

function restoreBlocks(race) {
	const waiting = [];
	let index = 0;
	for (; index < race.respawnQueue.length; index++) {
		const block = race.respawnQueue[index];
		if (block.respawnAt > race.time) break;
		if (
			race.marbles.some(
				(m) =>
					!m.finished &&
					collision(
						{ x: m.x, y: m.y, r: m.r + 2 },
						block.baseHeight ? { ...block, h: block.baseHeight } : block,
						race.time
					)
			)
		) {
			waiting.push(block);
			continue;
		}
		block.alive = true;
		block.hp = block.maxHp ?? 1;
		if (block.baseHeight) block.h = block.baseHeight;
		block.flash = 0;
		block.respawnAt = null;
	}
	if (index) race.respawnQueue = waiting.concat(race.respawnQueue.slice(index));
}

const previousPositions = new WeakMap();
const tickPositions = new WeakMap();
export function stepRace(race, dt = STEP) {
	if (dt <= 0 || dt > 1 / 60) throw new Error('물리 계산 간격은 1/60초 이하여야 합니다.');
	race.events = [];
	for (const wave of updateSkills(race.skills, race.marbles, race.time, dt)) {
		race.events.push({
			type: wave.type,
			soundType: wave.type,
			kind: 'skill',
			deviceId: `${wave.type}-${wave.id}`,
			id: wave.sourceId,
			x: wave.x,
			y: wave.y,
			time: wave.time,
			impact: 200
		});
	}
	if (race.spatial?.blocks !== race.blocks) {
		race.spatial = createSpatialIndex(race.blocks);
		race.blockLookup = new Map(race.blocks.map((b) => [b.id, b]));
		race.finaleBlocks = race.blocks.filter((b) => b.zoneId === 'finale');
		race.finaleOnlyY = race.layout.finale.start;
		for (const b of race.blocks)
			if (b.zoneId !== 'finale')
				race.finaleOnlyY = Math.max(
					race.finaleOnlyY,
					(b.pivotY ?? b.y) + Math.hypot(b.w, b.h) / 2 + (b.orbitRadius ?? 0)
				);
		race.movingBlocks = race.blocks.filter(
			(b) =>
				b.opensAt !== undefined || b.orbitRadius !== undefined || b.motion || b.type === 'seesaw'
		);
	}
	// 이동량을 반지름보다 작게 나눠 얇은 장치도 먼저 닿는 면에서 처리한다.
	let speed2 = (race.skills.waves.some((wave) => wave.type === 'gust') ? GUST_SPEED : 430) ** 2;
	for (const marble of race.marbles)
		if (!marble.finished) {
			speed2 = Math.max(speed2, marble.vx * marble.vx + marble.vy * marble.vy);
		}
	// 200개 이상은 출발부터 이동 상한을8로 둔다. 반지름13보다 작으며 빠른 이동은 계속 나눈다.
	const travel = race.marbles.length >= LARGE_RACE_SIZE ? 8 : 4;
	const divisions = Math.max(1, Math.ceil(((Math.sqrt(speed2) + 500) * dt) / travel));
	const h = dt / divisions;
	const damping = Math.exp(-h * 1.5),
		pulseDamping = Math.exp(-h * 0.6);
	let previous = previousPositions.get(race);
	if (!previous) previousPositions.set(race, (previous = []));
	const passages = [];
	for (const connector of [...race.layout.connectors, race.layout.finalApproach]) {
		passages.push({ id: connector.id, key: 'entry', line: connector.start });
		passages.push({ id: connector.id, key: 'exit', line: connector.end });
	}
	let tickBefore = tickPositions.get(race);
	if (!tickBefore) tickPositions.set(race, (tickBefore = []));
	for (const m of race.marbles)
		if (!m.finished) {
			const point = tickBefore[m.id] ?? (tickBefore[m.id] = { x: 0, y: 0 });
			point.x = m.x;
			point.y = m.y;
		}
	for (let part = 0; part < divisions; part++) {
		race.time += h;
		if (BLOCK_RESPAWN_ENABLED) restoreBlocks(race);
		for (const block of race.movingBlocks) {
			if (block.opensAt !== undefined && race.time >= block.opensAt) block.alive = false;
			if (block.motion) block.x = shuttleState(block, race.time).x;
			if (block.type === 'seesaw') block.tilt *= Math.exp(-h * 0.22);
			if (block.orbitRadius !== undefined) {
				const angle = blockAngle(block, race.time);
				block.x = block.pivotX + Math.cos(angle) * block.orbitRadius;
				block.y = block.pivotY + Math.sin(angle) * block.orbitRadius;
			}
		}
		applyGusts(race.skills, race.marbles, race.time);
		moveMarbles(race, h, previous, damping, pulseDamping);
		separateMarbles(race);
		for (const marble of race.marbles) {
			if (marble.finished) continue;
			constrainWalls(marble);
			constrainFinaleMotion(race, marble, previous[marble.id].x, previous[marble.id].y);
		}
		if (part === divisions - 1) settleFinaleContacts(race);
		recordProgress(race, part, divisions, previous, passages, h, dt, tickBefore);
	}
	return race.events;
}

export function winners(race, mode, count = 1, startRank = 1) {
	if (mode === 'nth')
		return race.finished.length >= count ? race.finished.slice(count - 1, count) : [];
	if (mode === 'last') {
		if (race.finished.length === race.marbles.length) return race.finished.slice(-1);
		if (race.finished.length === race.marbles.length - 1)
			return race.marbles.filter((marble) => !marble.finished);
		return [];
	}
	if (mode === 'multiple') {
		if (
			!Number.isSafeInteger(startRank) ||
			!Number.isSafeInteger(count) ||
			startRank < 1 ||
			count < 1 ||
			startRank > race.marbles.length ||
			count > race.marbles.length - startRank + 1
		)
			return [];
		return race.finished.slice(startRank - 1, startRank - 1 + count);
	}
	return race.finished.slice(0, 1);
}

export function raceOrder(race) {
	return [
		...race.finished,
		...race.marbles.filter((marble) => !marble.finished).sort((a, b) => b.y - a.y || a.id - b.id)
	];
}

// 이동과 기록을 별도 루프로 두되 물리 단계 안의 처리 순서는 유지한다.
function moveMarbles(race, h, previous, damping, pulseDamping) {
	for (const marble of race.marbles) {
		if (marble.finished) continue;
		const position = previous[marble.id] ?? (previous[marble.id] = { x: 0, y: 0 });
		position.x = marble.x;
		position.y = marble.y;
		if (marble.held) {
			marble.pinRest = null;
			if (race.time < marble.held.until) {
				// 번개 정지 중에도 움직이는 회전바는 구슬의 고정 위치를 밀어낸다.
				const bar = race.blockLookup.get('finale-bar');
				if (marble.held.kind === 'lightning' && bar?.alive && collision(marble, bar, race.time)) {
					resolveBlocks(race, marble, h, previous[marble.id]);
					marble.held.x = marble.x;
					marble.held.y = marble.y;
					marble.vx = marble.vy = 0;
				}
				continue;
			}
			if (marble.held.kind === 'lightning') marble.lastProgress = race.time;
			marble.held = null;
		}
		if (marble.ignored.size)
			for (const id of marble.ignored.keys()) {
				const block = race.blocks.find((b) => b.id === id);
				if (!block || !collision(marble, block, race.time)) marble.ignored.delete(id);
			}
		if (marble.specialContacts.size)
			for (const id of marble.specialContacts) {
				const block = race.blockLookup.get(id);
				if (
					!block?.alive ||
					!collision(
						{ x: marble.x, y: marble.y, r: marble.r + (block.type === 'frost' ? 12 : 2) },
						block,
						race.time
					)
				)
					marble.specialContacts.delete(id);
			}
		if (marble.y > marble.bestY + 25) {
			marble.bestY = marble.y;
			marble.lastProgress = race.time;
		}
		const enteredFinale = marble.finaleEntry !== null || marble.y >= race.layout.finale.start;
		if (enteredFinale) marble.windUntil = 0;
		if (!enteredFinale && race.time - marble.lastProgress > 8) {
			marble.windUntil = race.time + 1.5;
			marble.lastProgress = race.time;
			marble.windDirection = marble.x < 70 ? 1 : marble.x > WIDTH - 70 ? -1 : -marble.windDirection;
		}
		if (marble.windUntil > race.time) marble.vx += marble.windDirection * 320 * h;
		const pulseBoost = marble.pulseBoostUntil > race.time;
		// 파동 직후에는 낮은 공기 저항과 높은 속도 한도로 먼 거리까지 날아간다.
		const horizontalLimit = pulseBoost ? 1000 : 600;
		marble.vy = Math.min(pulseBoost ? 900 : 430, marble.vy + 420 * h);
		marble.vx = clamp(
			marble.vx * (pulseBoost ? pulseDamping : damping),
			-horizontalLimit,
			horizontalLimit
		);
		marble.x += marble.vx * h;
		marble.y += marble.vy * h;
		resolveBlocks(race, marble, h, previous[marble.id]);
	}
}
function recordProgress(race, part, divisions, previous, passages, h, dt, tickBefore) {
	const firstLine = Math.min(...passages.map((p) => p.line));
	const arrivals = [];
	for (const marble of race.marbles) {
		if (marble.finished) continue;
		releasePinRest(race, marble);
		const before = previous[marble.id];
		if (marble.y >= firstLine)
			for (const { id, key, line } of passages) {
				if (before.y >= line || marble.y < line) continue;
				let record = marble.scatterPassages.get(id);
				if (!record) {
					record = { contacts: [], entry: null, exit: null };
					marble.scatterPassages.set(id, record);
				}
				if (record[key]) continue;
				const fraction = (line - before.y) / (marble.y - before.y);
				let rank = 1;
				for (const other of race.marbles)
					if (other.id !== marble.id && (other.finished || other.y > marble.y)) rank++;
				record[key] = {
					x: before.x + (marble.x - before.x) * fraction,
					time: race.time - h + fraction * h,
					rank
				};
			}
		if (marble.zoneEntries.size < race.zones.length)
			for (const zone of race.zones)
				if (marble.y >= zone.y - 29 && !marble.zoneEntries.has(zone.id)) {
					marble.zoneEntries.set(zone.id, { x: marble.x, time: race.time });
				}
		if (marble.y >= race.zones[0].y - 29 && marble.finaleEntry === null) {
			marble.materialTravel ??= { minX: marble.x, maxX: marble.x };
			marble.materialTravel.minX = Math.min(marble.materialTravel.minX, marble.x);
			marble.materialTravel.maxX = Math.max(marble.materialTravel.maxX, marble.x);
		}
		if (marble.finaleEntry === null && marble.y >= race.layout.finale.start) {
			const fraction = (race.layout.finale.start - before.y) / (marble.y - before.y);
			marble.finaleEntry = race.time - h + clamp(fraction, 0, 1) * h;
			marble.windUntil = 0;
		}
		if (part !== divisions - 1) continue;
		const prior = tickBefore[marble.id];
		const finish = race.layout.finish;
		const mouth = race.layout.finale.mouthY;
		if (prior.y >= mouth && marble.y < mouth) marble.chuteEntered = false;
		if (prior.y < mouth && marble.y >= mouth && marble.y > prior.y) {
			const fraction = (mouth - prior.y) / (marble.y - prior.y);
			const x = prior.x + (marble.x - prior.x) * fraction;
			marble.chuteEntered = x - marble.r >= finish.left && x + marble.r <= finish.right;
		}
		if (prior.y < finish.y && marble.y >= finish.y && marble.y > prior.y) {
			const fraction = (finish.y - prior.y) / (marble.y - prior.y);
			const x = prior.x + (marble.x - prior.x) * fraction;
			if (
				marble.finaleEntry !== null &&
				marble.chuteEntered === true &&
				x - marble.r >= finish.left &&
				x + marble.r <= finish.right
			) {
				marble.finished = true;
				marble.finishTime = race.time - dt + fraction * dt;
				arrivals.push(marble);
			}
		}
	}
	arrivals.sort((a, b) => a.finishTime - b.finishTime || a.id - b.id);
	race.finished.push(...arrivals);
}

// 충돌의 두 좌표만 정규화해 거리 계산의 가변 인자 처리를 줄인다.
// 큰 좌표의 제곱 넘침과 작은 좌표의 소실을 피하고 특수 값은 기본 함수에 맡긴다.
export function contactDistance(x, y) {
	const a = Math.abs(x),
		b = Math.abs(y),
		maximum = Math.max(a, b);
	if (maximum === 0) return 0;
	if (!Number.isFinite(maximum)) return Math.hypot(x, y);
	const ratio = Math.min(a, b) / maximum;
	return maximum * Math.sqrt(1 + ratio * ratio);
}
