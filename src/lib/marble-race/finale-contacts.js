import { constrainFinaleMotion } from './finale-boundary.js';

const scratchByRace = new WeakMap();
const SMALL_GROUP_TOLERANCE = 0.15;
const CROWD_TOLERANCE = 0.5;
const MAX_PASSES = 512;
const SKIN = 6;
const REBUILD_DISTANCE2 = (SKIN / 2) ** 2;
const CELL_SIZE = 40;
// 폭720 경기장의18칸과 양쪽 탐색 여유가 같은 키로 겹치지 않는 간격이다.
const CELL_STRIDE = 32;

export function solveFinaleContacts(race, collision, blockAngle, display = false) {
	const eligible = (m) =>
		m.finaleEntry != null || m.y + m.r >= race.layout.finale.start || race.finaleIds?.has(m.id);
	let present = false;
	for (const m of race.marbles) {
		if (!m.finished && eligible(m)) {
			present = true;
			break;
		}
	}
	if (!present) return;
	let work = scratchByRace.get(race);
	if (!work) {
		work = {
			points: [],
			pairs: [],
			cells: new Int32Array(0),
			next: [],
			parents: [],
			roots: [],
			active: [],
			pressed: [],
			movable: [],
			x: [],
			y: [],
			bx: [],
			by: [],
			order: [],
			activePoints: []
		};
		scratchByRace.set(race, work);
	}
	const {
		points,
		pairs,
		next,
		parents,
		roots,
		active,
		pressed,
		movable,
		x,
		y,
		bx,
		by,
		order,
		activePoints
	} = work;
	let count = 0,
		samePoints = true;
	for (const m of race.marbles)
		if (!m.finished) {
			if (points[count] !== m) samePoints = false;
			points[count++] = m;
		}
	if (points.length !== count) samePoints = false;
	points.length = count;
	let cells = work.cells;
	let cellOffset = 0;
	// 구슬 구성이 같으면 직전 단계의 정렬 순서에서 시작한다. 비교 기준은 그대로다.
	if (!samePoints) {
		order.length = count;
		for (let i = 0; i < count; i++) order[i] = i;
	}
	// 밀집 반복 계산에서는 구슬 객체 대신 재사용하는 숫자 배열에 접근한다.
	const capacity = 2 ** Math.ceil(Math.log2(Math.max(16, count)));
	if (!work.px || work.px.length < capacity)
		for (const key of ['px', 'py', 'pvx', 'pvy', 'radii']) work[key] = packedDoubles(capacity);
	const { px, py, pvx, pvy, radii } = work;
	for (let i = 0; i < count; i++) {
		const m = points[i];
		px[i] = m.x;
		py[i] = m.y;
		pvx[i] = m.vx;
		pvy[i] = m.vy;
		radii[i] = m.r;
	}
	function sync(i) {
		const m = points[i];
		m.x = px[i];
		m.y = py[i];
		m.vx = pvx[i];
		m.vy = pvy[i];
	}
	const wallSets = work.wallSets ?? (work.wallSets = []);

	for (let i = 0; i < count; i++) {
		const m = points[i];
		movable[i] =
			!m.held ||
			(m.held.kind === 'lightning' &&
				(display || race.time - (race.finaleRotorContacts?.get(m) ?? -Infinity) <= 1 / 120 + 1e-9))
				? 1
				: 0;
	}
	const walls = race.finaleBlocks
		.filter((b) => b.alive)
		.map((block) => {
			const angle = blockAngle(block, race.time),
				corner = Math.min(block.cornerRadius ?? 0, block.w / 2, block.h / 2),
				c = Math.cos(angle),
				s = Math.sin(angle),
				halfW = block.w / 2 - corner,
				halfH = block.h / 2 - corner;
			return {
				block,
				c,
				s,
				corner,
				halfW,
				halfH,
				extentX: Math.abs(c) * halfW + Math.abs(s) * halfH + corner,
				extentY: Math.abs(s) * halfW + Math.abs(c) * halfH + corner
			};
		});
	function root(i) {
		while (parents[i] !== i) {
			parents[i] = parents[parents[i]];
			i = parents[i];
		}
		return i;
	}
	// 가까운 쌍과 연결된 구슬 묶음을 한 번 만든 뒤 재사용한다.
	// 누적 이동이 탐색 여유의 절반을 넘으면 새 이웃을 다시 찾는다.
	function rebuild() {
		// 현재 높이 범위만 연속 배열로 찾는다. 큰 보정과 음수 높이도 재탐색 때 반영한다.
		let minY = Infinity,
			maxY = -Infinity;
		for (let i = 0; i < count; i++) {
			minY = Math.min(minY, py[i]);
			maxY = Math.max(maxY, py[i]);
		}
		cellOffset = (Math.floor(minY / CELL_SIZE) - 1) * CELL_STRIDE;
		const cellCount = (Math.floor(maxY / CELL_SIZE) + 3) * CELL_STRIDE - cellOffset;
		if (cells.length < cellCount)
			cells = work.cells = new Int32Array(2 ** Math.ceil(Math.log2(cellCount)));
		cells.fill(-1);
		pairs.length = 0;
		for (let i = 0; i < count; i++) {
			parents[i] = i;
			roots[i] = false;
			active[i] = false;
			pressed[i] = false;
		}
		sortByHeight(order, py, points);
		for (const i of order) {
			const a = points[i],
				cx = Math.floor(px[i] / CELL_SIZE),
				cy = Math.floor(py[i] / CELL_SIZE);
			bx[i] = px[i];
			by[i] = py[i];
			for (let yy = cy - 1; yy <= cy + 1; yy++)
				for (let xx = cx - 1; xx <= cx + 1; xx++) {
					for (let j = cells[yy * CELL_STRIDE + xx - cellOffset] ?? -1; j !== -1; j = next[j]) {
						const b = points[j],
							dx = px[j] - px[i],
							dy = py[j] - py[i];
						if (dx * dx + dy * dy > (a.r + b.r + SKIN) ** 2) continue;
						pairs.push(j, i);
						const ra = root(i),
							rb = root(j);
						if (ra !== rb) parents[ra] = rb;
					}
				}
			const key = cy * CELL_STRIDE + cx - cellOffset;
			next[i] = cells[key] ?? -1;
			cells[key] = i;
		}
		// 연결 구성이 확정됐으므로 루트 탐색은 구슬마다 한 번만 한다.
		for (let i = 0; i < count; i++) parents[i] = root(i);
		for (let i = 0; i < count; i++)
			if (
				points[i].finaleEntry != null ||
				py[i] + radii[i] >= race.layout.finale.start ||
				race.finaleIds?.has(points[i].id)
			)
				roots[parents[i]] = true;
		for (let i = 0; i < count; i++) {
			if (
				display ||
				race.time - (race.finaleRotorContacts?.get(points[i]) ?? -Infinity) <= 1 / 120 + 1e-9
			)
				pressed[parents[i]] = true;
		}
		// 회전바의 압력이 같은 묶음의 번개 구슬에도 전달된다.
		// 고정 시간과 자체 속도는 유지하고 얼음 고정은 이동시키지 않는다.
		activePoints.length = 0;
		for (let i = 0; i < count; i++) {
			active[i] = roots[parents[i]];
			if (points[i].held?.kind === 'lightning' && pressed[parents[i]]) movable[i] = 1;
			if (!active[i]) continue;
			activePoints.push(i);
			x[i] = px[i];
			y[i] = py[i];
			const a = points[i];
			// 후보를 다시 찾을 때 가까운 벽도 함께 기록한다.
			const set = wallSets[i] ?? (wallSets[i] = []);
			set.length = 0;
			for (const g of walls) {
				const dx = px[i] - g.block.x,
					dy = py[i] - g.block.y;
				if (Math.abs(dx) > g.extentX + a.r + SKIN || Math.abs(dy) > g.extentY + a.r + SKIN)
					continue;
				const lx = dx * g.c + dy * g.s,
					ly = -dx * g.s + dy * g.c;
				const ox = Math.max(0, Math.abs(lx) - g.halfW),
					oy = Math.max(0, Math.abs(ly) - g.halfH);
				if (ox * ox + oy * oy <= (a.r + g.corner + SKIN) ** 2) set.push(g);
			}
		}
		// 결승과 연결되지 않은 쌍은 반복 보정에서 제외한다.
		let length = 0;
		for (let k = 0; k < pairs.length; k += 2)
			if (active[pairs[k]]) {
				pairs[length++] = pairs[k];
				pairs[length++] = pairs[k + 1];
			}
		pairs.length = length;
	}
	rebuild();
	const probe = { x: 0, y: 0, r: 0 };
	function project(i) {
		const m = points[i];
		if (!movable[i]) return 0;
		if (!wallSets[i].length && (px[i] - bx[i]) ** 2 + (py[i] - by[i]) ** 2 <= REBUILD_DISTANCE2) {
			px[i] = Math.max(radii[i] + 12, Math.min(720 - radii[i] - 12, px[i]));
			py[i] = Math.max(radii[i], py[i]);
			return 0;
		}
		sync(i);
		let maximum = 0;
		for (const g of (m.x - bx[i]) ** 2 + (m.y - by[i]) ** 2 > REBUILD_DISTANCE2
			? walls
			: wallSets[i]) {
			const b = g.block,
				dx = m.x - b.x,
				dy = m.y - b.y;
			if (Math.abs(dx) > g.extentX + m.r + 0.1 || Math.abs(dy) > g.extentY + m.r + 0.1) continue;
			probe.x = m.x;
			probe.y = m.y;
			probe.r = m.r + 0.1;
			const touch = collision(probe, b, race.time, g);
			if (!touch) continue;
			const depth = touch.depth - 0.1;
			if (depth > 0) {
				maximum = Math.max(maximum, depth);
				m.x += touch.nx * (depth + 0.001);
				m.y += touch.ny * (depth + 0.001);
			}
			if (!display) {
				const omega = b.type === 'rotor' ? b.angularSpeed * b.direction : 0;
				const vx = -omega * (m.y - b.y),
					vy = omega * (m.x - b.x);
				const speed = (m.vx - vx) * touch.nx + (m.vy - vy) * touch.ny;
				if (speed < 0) {
					m.vx -= speed * touch.nx;
					m.vy -= speed * touch.ny;
				}
			}
		}
		m.x = Math.max(m.r + 12, Math.min(720 - m.r - 12, m.x));
		m.y = Math.max(m.r, m.y);
		const vx = m.vx,
			vy = m.vy;
		if (wallSets[i].length || (m.x - bx[i]) ** 2 + (m.y - by[i]) ** 2 > REBUILD_DISTANCE2)
			constrainFinaleMotion(race, m, x[i], y[i]);
		if (display) {
			m.vx = vx;
			m.vy = vy;
		}
		px[i] = m.x;
		py[i] = m.y;
		pvx[i] = m.vx;
		pvy[i] = m.vy;
		return maximum;
	}
	// 큰 무리는 보정 뒤 남은 겹침을 직접 확인한다. 통과한 쌍을 계속 밀지 않는다.
	const crowd = count > 64;
	const residualTolerance = CROWD_TOLERANCE;
	function separated() {
		for (let k = 0; k < pairs.length; k += 2) {
			const i = pairs[k],
				j = pairs[k + 1];
			if (!(movable[i] + movable[j])) continue;
			const dx = px[i] - px[j],
				dy = py[i] - py[j],
				minimum = radii[i] + radii[j] - residualTolerance;
			if (dx * dx + dy * dy < minimum * minimum) return false;
		}
		return true;
	}
	if (crowd) {
		for (const i of activePoints) {
			x[i] = px[i];
			y[i] = py[i];
			project(i);
			x[i] = px[i];
			y[i] = py[i];
		}
		if (activePoints.some((i) => (px[i] - bx[i]) ** 2 + (py[i] - by[i]) ** 2 > REBUILD_DISTANCE2))
			rebuild();
	}
	for (let pass = 0; pass < MAX_PASSES && (!crowd || !separated()); pass++) {
		let rebuildNeeded = false;
		// 큰 무리의 첫3회만 위쪽 분리를 먼저 시도하고 매회 벽·남은 겹침을 확인한다.
		work.separateUpward = crowd && !display && pass < 3;
		let maximum = projectPairs(work, display);
		for (const i of activePoints) {
			let moved = (px[i] - bx[i]) ** 2 + (py[i] - by[i]) ** 2 > REBUILD_DISTANCE2;
			// 벽 후보가 없고 탐색 범위 안에 그대로 있으면 벽 보정 결과도 그대로다.
			if (
				movable[i] &&
				(wallSets[i].length ||
					moved ||
					px[i] < radii[i] + 12 ||
					px[i] > 720 - radii[i] - 12 ||
					py[i] < radii[i])
			) {
				maximum = Math.max(maximum, project(i));
				moved = (px[i] - bx[i]) ** 2 + (py[i] - by[i]) ** 2 > REBUILD_DISTANCE2;
			}
			if (moved) rebuildNeeded = true;
			x[i] = px[i];
			y[i] = py[i];
		}
		if (rebuildNeeded) rebuild();
		else if (!crowd && maximum <= SMALL_GROUP_TOLERANCE) break;
	}
	for (let i = 0; i < count; i++) sync(i);
	if (!display)
		for (let i = 0; i < count; i++) {
			const m = points[i];
			if (movable[i] && m.held?.kind === 'lightning') {
				m.held.x = m.x;
				m.held.y = m.y;
				m.vx = m.vy = 0;
			}
		}
}

// 반복되는 구슬 쌍 계산을 별도 함수로 둬 준비·벽 탐색과 독립적으로 최적화한다.
function projectPairs(work, display) {
	const { pairs, px, py, pvx, pvy, radii, movable } = work;
	let maximum = 0;
	for (let k = 0; k < pairs.length; k += 2) {
		const i = pairs[k],
			j = pairs[k + 1];
		const ix = px[i],
			iy = py[i],
			jx = px[j],
			jy = py[j];
		const dx = jx - ix,
			dy = jy - iy,
			r = radii[i] + radii[j];
		const distance2 = dx * dx + dy * dy;
		if (distance2 >= r * r) continue;
		const ia = movable[i],
			ib = movable[j];
		if (!(ia + ib)) continue;
		const distance = Math.sqrt(distance2),
			nx = distance > 1e-8 ? dx / distance : 1,
			ny = distance > 1e-8 ? dy / distance : 0;
		const depth = r - distance;
		maximum = Math.max(maximum, depth);
		// 위아래로 쌓인 접촉은 위쪽 여유 공간부터 풀어 아래 벽의 보정이 반복 전달되지 않게 한다.
		if (work.separateUpward && ia && ib && Math.abs(dy) > r * 0.5) {
			const gap = Math.sqrt(Math.max(0, r * r - dx * dx)) + 0.001;
			if (dy > 0) py[i] -= gap - dy;
			else py[j] -= gap + dy;
		} else {
			const amount = ((depth + 0.001) * 1.4) / (ia + ib);
			px[i] = ix - nx * amount * ia;
			py[i] = iy - ny * amount * ia;
			px[j] = jx + nx * amount * ib;
			py[j] = jy + ny * amount * ib;
		}
		if (!display) {
			const ivx = pvx[i],
				ivy = pvy[i],
				jvx = pvx[j],
				jvy = pvy[j];
			const speed = (jvx - ivx) * nx + (jvy - ivy) * ny;
			if (speed < 0) {
				const impulse = -speed / (ia + ib);
				pvx[i] = ivx - impulse * nx * ia;
				pvy[i] = ivy - impulse * ny * ia;
				pvx[j] = jvx + impulse * nx * ib;
				pvy[j] = jvy + impulse * ny * ib;
			}
		}
	}
	return maximum;
}

// 빈칸 없는 숫자 배열을 만든다. 경기 좌표는 호출 직후 모두 덮어쓴다.
function packedDoubles(capacity) {
	const array = [];
	for (let i = 0; i < capacity; i++) array.push(0.1);
	return array;
}

// 직전 단계의 높이순 목록은 대부분 정렬돼 있다. 큰 변화에는 기본 정렬로 전환한다.
function sortByHeight(order, y, points) {
	let shifts = 0;
	for (let i = 1; i < order.length; i++) {
		const id = order[i];
		let j = i - 1;
		while (j >= 0 && (y[id] - y[order[j]] || points[order[j]].id - points[id].id) > 0) {
			order[j + 1] = order[j];
			j--;
			shifts++;
		}
		order[j + 1] = id;
		if (shifts > order.length * 2) {
			order.sort((a, b) => y[b] - y[a] || points[a].id - points[b].id);
			return;
		}
	}
}
