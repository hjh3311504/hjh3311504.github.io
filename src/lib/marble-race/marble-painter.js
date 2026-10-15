// 경기장과 순위 카드가 같은 구슬의 빛·음영·번호를 사용한다.
export function drawMarble(ctx, marble, font = '800 10px SUIT, sans-serif') {
	const r = marble.r;
	ctx.fillStyle = marble.color;
	ctx.beginPath();
	ctx.arc(0, 0, r, 0, Math.PI * 2);
	ctx.fill();
	// 같은 색 위에 옅은 그림자만 얹어 테마와 관계없이 단색 느낌을 유지한다.
	const shade = ctx.createLinearGradient(0, -r, 0, r);
	shade.addColorStop(0.45, '#00000000');
	shade.addColorStop(1, '#0000002e');
	ctx.fillStyle = shade;
	ctx.fill();
	ctx.fillStyle = '#ffffffd9';
	ctx.beginPath();
	ctx.ellipse(-r * 0.36, -r * 0.42, r * 0.28, r * 0.17, -0.6, 0, Math.PI * 2);
	ctx.fill();
	ctx.font = font;
	ctx.textAlign = 'center';
	ctx.fillStyle = '#1f2d3a';
	ctx.fillText(String(marble.id + 1), 0, (4 * r) / 13);
}
