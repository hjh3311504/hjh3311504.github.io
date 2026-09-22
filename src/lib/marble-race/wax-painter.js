// 경기장과 소개 그림에서 같은 왁스 껍질을 사용한다. 좌표의 원점은 블록 중심이다.
const cracks = [
	[
		[-0.5, -0.17],
		[-0.29, -0.1],
		[-0.17, 0.05],
		[0.02, -0.04],
		[0.17, 0.12],
		[0.32, 0.02],
		[0.5, 0.15]
	],
	[
		[-0.17, 0.05],
		[-0.23, 0.26],
		[-0.13, 0.5]
	],
	[
		[0.02, -0.04],
		[0.08, -0.25],
		[-0.01, -0.5]
	],
	[
		[0.32, 0.02],
		[0.27, -0.22],
		[0.39, -0.5]
	],
	[
		[0.17, 0.12],
		[0.12, 0.32],
		[0.22, 0.5]
	],
	[
		[-0.29, -0.1],
		[-0.34, -0.31],
		[-0.46, -0.4]
	],
	[
		[-0.23, 0.26],
		[-0.4, 0.3],
		[-0.5, 0.42]
	]
];

export function drawCrackWax(ctx, block) {
	const { w, h } = block;
	const maxHp = block.maxHp ?? 5;
	const hits = Math.max(0, maxHp - (block.hp ?? maxHp));
	const damage = Math.min(1, hits / maxHp);
	ctx.save();
	ctx.beginPath();
	ctx.roundRect(-w / 2, -h / 2, w, h, block.cornerRadius ?? 16);
	ctx.clip();

	const shell = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
	shell.addColorStop(0, '#fff5e9');
	shell.addColorStop(0.35, '#f6d8ce');
	shell.addColorStop(0.8, '#e9b4aa');
	shell.addColorStop(1, '#c98583');
	ctx.fillStyle = shell;
	ctx.fillRect(-w / 2, -h / 2, w, h);

	// 안쪽으로 겹친 얇은 껍질의 테두리와 부드러운 왁스 광택.
	ctx.strokeStyle = '#fffaf0b0';
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.roundRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 13);
	ctx.stroke();
	ctx.fillStyle = '#fffaf058';
	ctx.beginPath();
	ctx.ellipse(-w * 0.18, -h * 0.28, w * 0.25, h * 0.08, -0.06, 0, Math.PI * 2);
	ctx.fill();

	// 손상이 없으면 매끈하게 두고, 충돌 누적에 따라 균열 가지를 늘린다.
	const count = Math.ceil(damage * cracks.length);
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';
	for (const points of cracks.slice(0, count)) {
		// 밝은 절단면 아래로 짙은 속살이 보여 껍질 두께를 드러낸다.
		for (const [offset, color, width] of [
			[1.3, '#fff9ed', 2.4 + damage * 2.8],
			[0, '#a45c69', 0.9 + damage * 2.8]
		]) {
			ctx.strokeStyle = color;
			ctx.lineWidth = width;
			ctx.beginPath();
			points.forEach(([x, y], i) => {
				if (i === 0) ctx.moveTo(x * w, y * h + offset);
				else ctx.lineTo(x * w, y * h + offset);
			});
			ctx.stroke();
		}
	}
	if (damage > 0) {
		// 손상이 늘수록 갈라진 껍질 조각이 안쪽에서 들린다.
		ctx.fillStyle = '#fff4df';
		for (const [x, y, direction] of [
			[-0.17, 0.05, -1],
			[0.17, 0.12, 1],
			[0.32, 0.02, -1]
		]) {
			const size = 2 + damage * 7;
			ctx.beginPath();
			ctx.moveTo(x * w - size, y * h);
			ctx.lineTo(x * w + size, y * h + 2);
			ctx.lineTo(x * w + size * 0.3, y * h + direction * size);
			ctx.closePath();
			ctx.fill();
		}
	}
	ctx.restore();
}
