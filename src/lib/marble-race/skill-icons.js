// 작은 도감에서도 알아보기 쉽도록 구슬 없이 능력의 상징만 그린다.
export function drawSkillIcon(ctx, type) {
	ctx.save();
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';
	if (type === 'lightning') {
		ctx.fillStyle = '#f4be36';
		ctx.strokeStyle = '#a66b10';
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		ctx.moveTo(18, 2);
		ctx.lineTo(6, 18);
		ctx.lineTo(14, 18);
		ctx.lineTo(11, 30);
		ctx.lineTo(27, 12);
		ctx.lineTo(18, 12);
		ctx.lineTo(21, 2);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	} else if (type === 'gust') {
		ctx.strokeStyle = '#258991';
		ctx.lineWidth = 2.4;
		ctx.beginPath();
		ctx.moveTo(3, 10);
		ctx.lineTo(16, 10);
		ctx.bezierCurveTo(24, 10, 23, 1, 17, 4);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(2, 16);
		ctx.lineTo(24, 16);
		ctx.bezierCurveTo(32, 16, 30, 7, 25, 10);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(5, 22);
		ctx.lineTo(18, 22);
		ctx.bezierCurveTo(25, 22, 24, 30, 18, 28);
		ctx.stroke();
	}
	ctx.restore();
}
