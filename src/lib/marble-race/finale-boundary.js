const geometries = new WeakMap();
function geometry(block) {
	let g = geometries.get(block);
	if (
		g &&
		g.x === block.x &&
		g.y === block.y &&
		g.w === block.w &&
		g.h === block.h &&
		g.angle === block.angle
	)
		return g;
	g = {
		x: block.x,
		y: block.y,
		w: block.w,
		h: block.h,
		angle: block.angle,
		c: Math.cos(block.angle),
		s: Math.sin(block.angle),
		half: (block.w - block.h) / 2
	};
	geometries.set(block, g);
	return g;
}

// 구슬 중심의 이동선과 반지름만큼 두꺼워진 둥근 벽의 첫 접점을 찾는다.
function sweep(g, radius, x, y, tx, ty) {
	const reach = radius + g.h / 2;
	const ex = Math.abs(g.c * g.half) + reach,
		ey = Math.abs(g.s * g.half) + reach;
	if (
		Math.max(x, tx) < g.x - ex ||
		Math.min(x, tx) > g.x + ex ||
		Math.max(y, ty) < g.y - ey ||
		Math.min(y, ty) > g.y + ey
	)
		return null;
	const px = (x - g.x) * g.c + (y - g.y) * g.s;
	const py = -(x - g.x) * g.s + (y - g.y) * g.c;
	const dx = (tx - x) * g.c + (ty - y) * g.s;
	const dy = -(tx - x) * g.s + (ty - y) * g.c;
	const length2 = dx * dx + dy * dy;
	if (length2 < 1e-16) return null;
	let best = null;
	const consider = (t, nx, ny, depth = 0) => {
		if (t < -1e-9 || t > 1 || dx * nx + dy * ny >= -1e-9 || (best && t >= best.t)) return;
		best = { t: Math.max(0, t), nx: nx * g.c - ny * g.s, ny: nx * g.s + ny * g.c, depth };
	};
	const nearest = Math.max(-g.half, Math.min(g.half, px));
	const ox = px - nearest,
		distance = ox === 0 ? Math.abs(py) : py === 0 ? Math.abs(ox) : Math.hypot(ox, py);
	if (distance > 1e-9 && distance < reach)
		consider(0, ox / distance, py / distance, reach - distance);
	if (Math.abs(dy) > 1e-12) {
		for (const sign of [-1, 1]) {
			const t = (sign * reach - py) / dy;
			if (Math.abs(px + dx * t) <= g.half) consider(t, 0, sign);
		}
	}
	for (const endpoint of [-g.half, g.half]) {
		const sx = px - endpoint,
			b = sx * dx + py * dy;
		const discriminant = b * b - length2 * (sx * sx + py * py - reach * reach);
		if (discriminant < 0) continue;
		const t = (-b - Math.sqrt(discriminant)) / length2;
		const hx = sx + dx * t,
			hy = py + dy * t;
		consider(t, hx / reach, hy / reach);
	}
	return best;
}

// 밀집 보정과 회전바가 큰 변위를 만들어도 벽 너머로 옮겨 놓지 않는다.
// 새 반발력이나 효과음을 추가하지 않고 벽을 향하는 이동·속도 성분만 제거한다.
export function constrainFinaleMotion(race, marble, fromX, fromY) {
	if (marble.finished || (marble.held && marble.held.kind !== 'lightning')) return false;
	const finale = race.layout.finale;
	// 직선 벽의 둥근 끝은 시작 높이보다 최대12 위에 있다.
	const top =
		Math.min(finale.guideStartY ?? finale.start, finale.rightGuideStartY ?? finale.start) - 12;
	if (Math.max(fromY, marble.y) < top - marble.r) return false;
	if (fromX === marble.x && fromY === marble.y) return false;
	let x = fromX,
		y = fromY,
		tx = marble.x,
		ty = marble.y,
		changed = false;
	for (let pass = 0; pass < 4; pass++) {
		let hit = null;
		for (const block of race.finaleBlocks) {
			if (
				!block.alive ||
				block.arc ||
				(block.deviceId !== 'finale-guide' && block.deviceId !== 'finale-chute')
			)
				continue;
			const candidate = sweep(geometry(block), marble.r, x, y, tx, ty);
			if (candidate && (!hit || candidate.t < hit.t)) hit = candidate;
		}
		if (!hit) break;
		changed = true;
		const dx = tx - x,
			dy = ty - y;
		x += dx * hit.t + hit.nx * (hit.depth + 0.001);
		y += dy * hit.t + hit.ny * (hit.depth + 0.001);
		const remainingX = dx * (1 - hit.t),
			remainingY = dy * (1 - hit.t);
		const normal = Math.min(0, remainingX * hit.nx + remainingY * hit.ny);
		tx = x + remainingX - normal * hit.nx;
		ty = y + remainingY - normal * hit.ny;
		const velocity = Math.min(0, marble.vx * hit.nx + marble.vy * hit.ny);
		marble.vx -= velocity * hit.nx;
		marble.vy -= velocity * hit.ny;
		// 접촉이 계속 이어지면 마지막으로 확인한 안전한 접점에서 멈춘다.
		if (pass === 3) {
			tx = x;
			ty = y;
		}
	}
	if (changed) {
		marble.x = tx;
		marble.y = ty;
		if (marble.held?.kind === 'lightning') {
			marble.held.x = tx;
			marble.held.y = ty;
		}
	}
	return changed;
}
