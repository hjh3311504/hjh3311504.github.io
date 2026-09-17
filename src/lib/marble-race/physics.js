import { BLOCKS, MARBLE_COLORS, BREAKABLE_TYPES, resolveMap } from './catalog.js';

export const WIDTH = 720;
export const TILE_ROWS = 12;
const TILE_PITCH = 34;
const FIRST_LAYER_Y = 300;
const SPECIAL_HEIGHT = 960;
const PIN_SECTION_HEIGHT = 260;
const CONNECTOR_HEIGHT = SPECIAL_HEIGHT + PIN_SECTION_HEIGHT;
export const RESPAWN_DELAY = 3;
const FINALE_HEIGHT = 740;
export const STEP = 1 / 120;
const RADIUS = 13;
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

export function createLayout(mapId, participantCount = 2) {
	const map = resolveMap(mapId);
	const zones = [],
		connectors = [];
	let y = Math.max(FIRST_LAYER_Y, 70 + (Math.ceil(participantCount / 26) - 1) * 40 + 90);
	for (const [index, type] of map.layers.entries()) {
		const zone = {
			id: `layer-${index}`,
			type,
			y,
			start: y - 16,
			end: y + TILE_ROWS * TILE_PITCH - 16
		};
		zones.push(zone);
		y += TILE_ROWS * TILE_PITCH;
		if (index < map.layers.length - 1) {
			connectors.push({
				id: `connector-${connectors.length}`,
				zoneId: zone.id,
				start: y - 16,
				end: y + CONNECTOR_HEIGHT - 16,
				kind: ['scatter', 'butter', 'pond'][index],
				pinStart: y - 16 + SPECIAL_HEIGHT
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
		finalApproach,
		zones,
		connectors,

		finale: {
			id: 'finale',
			start: y,
			end: y + FINALE_HEIGHT,
			mouthY: y + 400,
			rotor: { x: 290, y: y + 400 }
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
				makeBlock('rubber', x, section.pinStart + offset, {
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
				})
			);
}
export function createMap(mapId, random = randomGenerator(1), layout = createLayout(mapId)) {
	const blocks = [];

	for (const zone of layout.zones)
		for (let row = 0; row < TILE_ROWS; row++)
			for (let col = 0; col < 20; col++)
				blocks.push(
					makeBlock(zone.type, 37 + col * 34 + (row % 2 ? 8 : -8), zone.y + row * 34, {
						id: `${zone.id}-${row}-${col}`,
						zoneId: zone.id,
						tile: true,
						w: 32,
						h: 32,
						cornerRadius: 10
					})
				);
	for (const connector of layout.connectors) {
		const { id, start, kind } = connector;
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
		if (kind === 'butter') {
			for (const [row, xs] of [
				[0, [116, 360, 604]],
				[1, [238, 482]]
			])
				for (const x of xs)
					blocks.push(
						makeBlock('butter', x, start + 330 + row * 220, {
							...common,
							id: `${id}-butter-${row}-${x}`,
							deviceId: `${id}-butter-${row}-${x}`,
							w: 120,
							h: 64,
							baseHeight: 64,
							hp: butterHitCount(layout.participantCount),
							maxHp: butterHitCount(layout.participantCount),
							cornerRadius: 16,
							special: true
						})
					);
		} else if (kind === 'pond') {
			const bypassLeft = random() < 0.5;
			connector.bypass = bypassLeft ? { left: 12, right: 256 } : { left: 464, right: 708 };
			blocks.push(
				makeBlock('pond', bypassLeft ? 482 : 238, start + 480, {
					...common,
					id: `${id}-pond`,
					w: 452,
					h: 140,
					cornerRadius: 0,
					special: true
				})
			);
		}
		addScatterPins(blocks, connector);
	}
	addScatterPins(blocks, layout.finalApproach);
	const y = layout.finale.start;
	blocks.push(
		makeBlock('rotor', layout.finale.rotor.x, layout.finale.rotor.y, {
			id: 'finale-bar',
			zoneId: 'finale',
			deviceId: 'finale-bar',
			soundType: 'rubber',
			w: 180,
			h: 16,
			cornerRadius: 8,
			angularSpeed: (Math.PI * 2) / 4.4,
			direction: -1,
			phase: random() * Math.PI * 2,
			restitution: 0.35,
			friction: 0.05
		})
	);
	for (const side of [-1, 1]) {
		// 직선 깔때기의 안쪽 면을 폭40 출구에 연결한다. 벽 두께는 바깥으로 둔다.
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
				extendEnds: true,
				friction: 0,
				cornerRadius: 6
			})
		);
	}

	return blocks;
}

// 회전·왕복 장치의 전체 이동 범위도 격자에 등록한다.
const CELL = 68;
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
				const key = `${x},${y}`;
				if (!cells.has(key)) cells.set(key, []);
				cells.get(key).push(order);
			}
	});
	return { blocks, cells };
}
export function nearbyBlocks(index, marble) {
	const orders = new Set();
	for (
		let y = Math.floor((marble.y - marble.r) / CELL);
		y <= Math.floor((marble.y + marble.r) / CELL);
		y++
	)
		for (
			let x = Math.floor((marble.x - marble.r) / CELL);
			x <= Math.floor((marble.x + marble.r) / CELL);
			x++
		)
			for (const order of index.cells.get(`${x},${y}`) ?? []) orders.add(order);
	return [...orders].sort((a, b) => a - b).map((order) => index.blocks[order]);
}
export function followedMarble(race, mode, focusId) {
	const alive = race.marbles.filter((m) => !m.finished);
	return (
		alive.find((m) => m.id === Number(focusId)) ??
		alive.sort((a, b) => (mode === 'last' ? a.y - b.y : b.y - a.y) || a.id - b.id)[0]
	);
}
export function* prepareRace(participants, mapId = 'crunch', seed = 1) {
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
	const layout = createLayout(mapId, names.length),
		blocks = createMap(mapId, random, layout);
	const positions = [];
	const columns = Math.min(26, names.length);
	for (let i = 0; i < names.length; i++) {
		const row = Math.floor(i / columns),
			col = i % columns;
		const rowCount = Math.min(columns, names.length - row * columns);
		positions.push({
			x:
				names.length === 2
					? 180 + col * 360
					: columns <= 24
						? 60 + (col * 600) / (columns - 1)
						: 25 + (col * 670) / Math.max(1, rowCount - 1),
			y: names.length <= 26 ? 60 + random() * 180 : 70 + row * 40 + random() * 8,
			r: RADIUS
		});
		if (i % 256 === 0) yield { phase: 'positions', count: i };
	}
	for (let i = positions.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[positions[i], positions[j]] = [positions[j], positions[i]];
		if (i % 256 === 0) yield { phase: 'shuffle', count: i };
	}
	const marbles = [];
	for (let index = 0; index < names.length; index++) {
		const name = names[index];
		marbles.push({
			id: index,
			name,
			color: MARBLE_COLORS[index % MARBLE_COLORS.length],
			...positions[index],
			vx: 0,
			vy: 0,
			contacts: new Map(),
			ignored: new Map(),
			held: null,
			finished: false,
			finishTime: null,
			bestY: 0,
			lastProgress: 0,
			windUntil: 0,
			windDirection: random() < 0.5 ? -1 : 1,
			scatterPassages: new Map(),
			brokenPositions: new Set(),
			zoneEntries: new Map(),
			finaleEntry: null,
			specialContacts: new Set(),
			materialTravel: null,
			trail: []
		});
		if (index % 256 === 0) yield { phase: 'marbles', count: index };
	}
	return {
		marbles,
		blocks,
		zones: layout.zones,
		respawnQueue: [],
		layout,
		time: 0,
		finished: [],
		events: [],
		seed,
		map: resolveMap(mapId)
	};
}

export function createRace(names, mapId = 'crunch', seed = 1) {
	const iterator = prepareRace(names, mapId, seed);
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

// 구슬 중심을 블록의 로컬 좌표로 옮겨 충돌면을 계산한다.
export function collision(marble, block, time) {
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

	const angle = blockAngle(block, time);
	const c = Math.cos(angle),
		s = Math.sin(angle);
	const dx = marble.x - block.x,
		dy = marble.y - block.y;
	const lx = dx * c + dy * s,
		ly = -dx * s + dy * c;
	const corner = Math.min(block.cornerRadius ?? 0, block.w / 2, block.h / 2);
	const halfW = block.w / 2 - corner,
		halfH = block.h / 2 - corner;
	const px = clamp(lx, -halfW, halfW),
		py = clamp(ly, -halfH, halfH);
	let nx = lx - px,
		ny = ly - py;
	const distance = Math.hypot(nx, ny);
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
	emit(race, block, marble, true, impact, contact);
}

export function hitBlock(race, marble, block, hit, dt = STEP) {
	if (!block.alive || !hit) return;
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
	if (block.type === 'butter') {
		const impact = Math.max(0, -(marble.vx * hit.nx + marble.vy * hit.ny));
		const freshContact = !marble.specialContacts.has(block.id);
		bounce(marble, hit, 0.35, 0.25);
		if (!freshContact || dt <= 0 || impact < 5) return;
		marble.specialContacts.add(block.id);
		block.hp--;
		if (block.hp === 0) destroyBlock(race, marble, block, impact);
		else {
			block.h = block.baseHeight * (0.45 + (0.55 * block.hp) / (block.maxHp ?? 5));
			emit(race, block, marble, false, impact);
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
	if (!from || collision({ ...marble, ...from }, block, time)) return 0;
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
function resolveBlocks(race, marble, dt, from) {
	const touched = new Set();
	for (let pass = 0; pass < 3; pass++) {
		let resolved = false;
		const candidates = nearbyBlocks(race.spatial, marble)
			.filter((block) => block.alive && collision(marble, block, race.time))
			.map((block) => ({ block, fraction: firstContactFraction(marble, block, from, race.time) }))
			.sort((a, b) => a.fraction - b.fraction);
		for (const { block } of candidates) {
			if (!block.alive) continue;
			const hit = collision(marble, block, race.time);
			if (!hit) continue;
			// 겹침 보정 중에는 같은 효과장의 힘을 중복 적용하지 않는다.
			if (touched.has(block.id) && ['gel', 'wind', 'sticky', 'pond'].includes(block.type)) continue;
			touched.add(block.id);
			hitBlock(race, marble, block, hit, dt);
			if (marble.held) return;
			if (!['gel', 'wind', 'sticky', 'pond'].includes(block.type)) resolved = true;
		}
		constrainWalls(marble);
		if (!resolved) break;
	}
}
function separateMarbles(race) {
	const marbles = race.marbles,
		cells = new Map(),
		keys = new Map();
	const key = (m) => `${Math.floor(m.x / 32)},${Math.floor(m.y / 32)}`;
	const update = (m) => {
		if (m.finished) return;
		const k = key(m),
			old = keys.get(m.id);
		if (k === old) return;
		if (old) cells.get(old)?.delete(m);
		if (!cells.has(k)) cells.set(k, new Set());
		cells.get(k).add(m);
		keys.set(m.id, k);
	};
	for (const m of marbles) update(m);
	for (let i = 0; i < marbles.length; i++) {
		const a = marbles[i];
		if (a.finished) continue;
		const candidates = [];
		const cx = Math.floor(a.x / 32),
			cy = Math.floor(a.y / 32);
		for (let y = cy - 1; y <= cy + 1; y++)
			for (let x = cx - 1; x <= cx + 1; x++)
				for (const b of cells.get(`${x},${y}`) ?? []) if (b.id > a.id) candidates.push(b);
		candidates.sort((a, b) => a.id - b.id);
		for (const b of candidates) {
			if (b.finished || (a.held && b.held)) continue;
			const dx = b.x - a.x,
				dy = b.y - a.y,
				distance = Math.hypot(dx, dy);
			if (distance >= a.r + b.r) continue;
			const nx = distance > 0.001 ? dx / distance : 1,
				ny = distance > 0.001 ? dy / distance : 0;
			const ia = a.held ? 0 : 1,
				ib = b.held ? 0 : 1,
				total = ia + ib;
			const overlap = Math.min(4, a.r + b.r - distance) / total;
			a.x -= nx * overlap * ia;
			a.y -= ny * overlap * ia;
			b.x += nx * overlap * ib;
			b.y += ny * overlap * ib;
			const speed = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
			if (speed < 0) {
				const impulse = (-speed * 1.6) / total;
				a.vx -= impulse * nx * ia;
				a.vy -= impulse * ny * ia;
				b.vx += impulse * nx * ib;
				b.vy += impulse * ny * ib;
			}
			if (!a.held) resolveBlocks(race, a, 0);
			if (!b.held) resolveBlocks(race, b, 0);
			update(a);
			update(b);
		}
	}
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

export function stepRace(race, dt = STEP) {
	if (dt <= 0 || dt > 1 / 60) throw new Error('물리 계산 간격은 1/60초 이하여야 합니다.');
	race.events = [];
	if (race.spatial?.blocks !== race.blocks) {
		race.spatial = createSpatialIndex(race.blocks);
		race.blockLookup = new Map(race.blocks.map((b) => [b.id, b]));
		race.movingBlocks = race.blocks.filter(
			(b) =>
				b.opensAt !== undefined || b.orbitRadius !== undefined || b.motion || b.type === 'seesaw'
		);
	}
	// 이동량을 반지름보다 작게 나눠 얇은 장치도 먼저 닿는 면에서 처리한다.
	let speed = 430;
	for (const marble of race.marbles)
		if (!marble.finished) speed = Math.max(speed, Math.hypot(marble.vx, marble.vy));
	const divisions = Math.max(1, Math.ceil(((speed + 500) * dt) / 4));
	const h = dt / divisions;
	for (let part = 0; part < divisions; part++) {
		race.time += h;
		restoreBlocks(race);
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
		const previous = new Map();
		for (const marble of race.marbles) {
			if (marble.finished) continue;
			previous.set(marble.id, { x: marble.x, y: marble.y });
			if (marble.held) {
				if (race.time < marble.held.until) continue;
				marble.held = null;
			}
			for (const id of marble.ignored.keys()) {
				const block = race.blocks.find((b) => b.id === id);
				if (!block || !collision(marble, block, race.time)) marble.ignored.delete(id);
			}
			for (const id of marble.specialContacts) {
				const block = race.blockLookup.get(id);
				if (!block?.alive || !collision({ ...marble, r: marble.r + 2 }, block, race.time))
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
				marble.windDirection =
					marble.x < 70 ? 1 : marble.x > WIDTH - 70 ? -1 : -marble.windDirection;
			}
			if (marble.windUntil > race.time) marble.vx += marble.windDirection * 320 * h;
			marble.vy = Math.min(430, marble.vy + 420 * h);
			marble.vx = clamp(marble.vx * Math.exp(-h * 1.5), -600, 600);
			marble.x += marble.vx * h;
			marble.y += marble.vy * h;
			resolveBlocks(race, marble, h, previous.get(marble.id));
		}
		separateMarbles(race);
		const arrivals = [];
		for (const marble of race.marbles) {
			if (marble.finished) continue;
			constrainWalls(marble);
			const before = previous.get(marble.id);
			for (const connector of [...race.layout.connectors, race.layout.finalApproach]) {
				for (const [key, line] of [
					['entry', connector.start],
					['exit', connector.end]
				]) {
					if (before.y >= line || marble.y < line) continue;
					let record = marble.scatterPassages.get(connector.id);
					if (!record) {
						record = { contacts: [], entry: null, exit: null };
						marble.scatterPassages.set(connector.id, record);
					}
					if (record[key]) continue;
					const fraction = (line - before.y) / (marble.y - before.y);
					record[key] = {
						x: before.x + (marble.x - before.x) * fraction,
						time: race.time - h + fraction * h,
						rank:
							1 +
							race.marbles.filter(
								(other) => other.id !== marble.id && (other.finished || other.y > marble.y)
							).length
					};
				}
			}
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
			const finish = race.layout.finish;
			if (before.y < finish.y && marble.y >= finish.y && marble.y > before.y) {
				const fraction = (finish.y - before.y) / (marble.y - before.y);
				const x = before.x + (marble.x - before.x) * fraction;
				if (
					marble.finaleEntry !== null &&
					x - marble.r >= finish.left &&
					x + marble.r <= finish.right
				) {
					marble.finished = true;
					marble.finishTime = race.time - h + fraction * h;
					arrivals.push(marble);
				}
			}
		}
		arrivals.sort((a, b) => a.finishTime - b.finishTime || a.id - b.id);
		race.finished.push(...arrivals);
	}
	return race.events;
}

export function winners(race, mode, count = 1) {
	if (mode === 'nth')
		return race.finished.length >= count ? race.finished.slice(count - 1, count) : [];
	if (mode === 'last')
		return race.finished.length === race.marbles.length ? race.finished.slice(-1) : [];
	return race.finished.slice(
		0,
		mode === 'multiple' ? clamp(Math.floor(count) || 1, 1, race.marbles.length) : 1
	);
}

export function raceOrder(race) {
	return [
		...race.finished,
		...race.marbles.filter((marble) => !marble.finished).sort((a, b) => b.y - a.y || a.id - b.id)
	];
}
