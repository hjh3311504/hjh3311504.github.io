// 경기장과 순위 카드가 같은 구슬의 빛·음영·번호를 사용한다.
export function drawMarble(ctx, marble, font = '800 10px SUIT, sans-serif') {
	const ratio = marble.r / 13;
	const gradient = ctx.createRadialGradient(
		-4 * ratio,
		-5 * ratio,
		ratio,
		2 * ratio,
		3 * ratio,
		marble.r + 3 * ratio
	);
	gradient.addColorStop(0, '#ffffff');
	gradient.addColorStop(0.3, marble.color);
	gradient.addColorStop(1, '#304a61');
	ctx.fillStyle = gradient;
	ctx.beginPath();
	ctx.arc(0, 0, marble.r, 0, Math.PI * 2);
	ctx.fill();
	ctx.font = font;
	ctx.textAlign = 'center';
	ctx.fillStyle = '#142736';
	ctx.fillText(String(marble.id + 1), 0, 4 * ratio);
}
