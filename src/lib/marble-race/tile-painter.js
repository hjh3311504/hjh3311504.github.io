import { BLOCKS } from './catalog.js';

// 경기장과 블록 도감이 동일한 타일 그림을 사용한다.
export function createTilePainter(ctx) {
	function rounded(x, y, w, h, radius = 7) {
		ctx.beginPath();
		ctx.roundRect(x, y, w, h, radius);
	}
	function line(points) {
		ctx.beginPath();
		points.forEach(([x, y], index) => (index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
		ctx.stroke();
	}
	function drawTile(block, fade = 1) {
		const { type, w, h } = block;
		const color = BLOCKS[type].color;
		ctx.save();
		ctx.translate(block.x, block.y);
		ctx.globalAlpha = fade;
		if (fade < 1) {
			ctx.translate(0, (1 - fade) * 8);
			ctx.scale(1 + (1 - fade) * 0.15, Math.max(0.2, fade));
		}
		ctx.fillStyle = color;
		rounded(-w / 2, -h / 2, w, h, block.cornerRadius ?? 3);
		ctx.fill();
		ctx.clip();
		ctx.strokeStyle = '#ffffff70';
		ctx.lineWidth = 1;
		line([
			[-14, 12],
			[-14, -14],
			[13, -14]
		]);
		ctx.strokeStyle = '#11263855';
		line([
			[-13, 15],
			[15, 15],
			[15, -13]
		]);
		ctx.strokeStyle = '#253b5266';
		ctx.fillStyle = '#253b5266';
		const circle = (x, y, r, fill = true) => {
			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI * 2);
			if (fill) ctx.fill();
			else ctx.stroke();
		};
		if (type === 'ember') {
			ctx.fillStyle = '#784737';
			rounded(-12, 6, 24, 7, 3);
			ctx.fill();
			ctx.fillStyle = '#f35d37';
			ctx.beginPath();
			ctx.moveTo(-8, 7);
			ctx.bezierCurveTo(-15, -1, -1, -4, -3, -14);
			ctx.bezierCurveTo(5, -9, 5, -4, 5, -2);
			ctx.lineTo(9, -7);
			ctx.bezierCurveTo(15, 4, 9, 10, 1, 10);
			ctx.closePath();
			ctx.fill();
			ctx.fillStyle = '#fff0a1';
			ctx.beginPath();
			ctx.moveTo(-3, 7);
			ctx.quadraticCurveTo(-5, 3, 2, -4);
			ctx.quadraticCurveTo(7, 6, 3, 9);
			ctx.closePath();
			ctx.fill();
			circle(-10, -8, 1.5);
			circle(10, -12, 1.2);
		} else if (type === 'droplet') {
			ctx.strokeStyle = '#e3fcff';
			ctx.lineWidth = 1.3;
			ctx.beginPath();
			ctx.ellipse(0, 10, 12, 3, 0, 0, Math.PI * 2);
			ctx.stroke();
			ctx.fillStyle = '#258cc4';
			ctx.beginPath();
			ctx.moveTo(0, -13);
			ctx.bezierCurveTo(-3, -7, -10, -2, -9, 3);
			ctx.bezierCurveTo(-8, 12, 8, 12, 9, 3);
			ctx.bezierCurveTo(10, -2, 3, -7, 0, -13);
			ctx.fill();
			ctx.strokeStyle = '#d9faff';
			ctx.lineWidth = 2;
			line([
				[-4, -3],
				[-5, 2],
				[-3, 5]
			]);
		} else if (type === 'frog') {
			ctx.fillStyle = '#4b9647';
			circle(-7, -7, 6);
			circle(7, -7, 6);
			ctx.beginPath();
			ctx.ellipse(0, 3, 13, 10, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = '#effadb';
			circle(-7, -8, 3.5);
			circle(7, -8, 3.5);
			ctx.fillStyle = '#203b2c';
			circle(-7, -8, 1.7);
			circle(7, -8, 1.7);
			ctx.strokeStyle = '#244b30';
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.moveTo(-7, 4);
			ctx.quadraticCurveTo(0, 10, 7, 4);
			ctx.stroke();
			ctx.fillStyle = '#eebc8c';
			circle(-9, 3, 2);
			circle(9, 3, 2);
		} else if (type === 'duck') {
			ctx.fillStyle = '#fff1ac';
			ctx.beginPath();
			ctx.ellipse(-1, 5, 11, 8, 0, 0, Math.PI * 2);
			ctx.fill();
			circle(3, -5, 8);
			ctx.fillStyle = '#ef9342';
			rounded(6, -5, 10, 5, 2);
			ctx.fill();
			ctx.fillStyle = '#343a32';
			circle(4, -8, 1.5);
			ctx.strokeStyle = '#d6ae45';
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.moveTo(-8, 3);
			ctx.quadraticCurveTo(-2, 10, 3, 4);
			ctx.stroke();
		} else if (type === 'asmr') {
			ctx.fillStyle = '#dcfaffbb';
			ctx.beginPath();
			ctx.ellipse(0, -3, 11, 12 * fade, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.strokeStyle = '#39869b';
			ctx.lineWidth = 1.5;
			ctx.stroke();
			ctx.fillStyle = '#39869b';
			ctx.beginPath();
			ctx.moveTo(0, 8);
			ctx.lineTo(-3, 13);
			ctx.lineTo(3, 13);
			ctx.closePath();
			ctx.fill();
			ctx.strokeStyle = '#ffffff';
			line([
				[-6, -8],
				[-7, -4]
			]);
		} else if (type === 'cork') {
			ctx.fillStyle = '#946538';
			rounded(-9, -8, 18, 21, 4);
			ctx.fill();
			ctx.fillStyle = '#f3d4a3';
			rounded(-12, -13, 24, 10, 4);
			ctx.fill();
			ctx.fillStyle = '#694a2f99';
			for (const [x, y] of [
				[-6, -8],
				[4, -10],
				[-4, 0],
				[5, 4],
				[-2, 8]
			])
				circle(x, y, 1.3);
		} else if (type === 'typewriter') {
			ctx.fillStyle = '#536271';
			rounded(-12, -12, 24, 24, 3);
			ctx.fill();
			ctx.fillStyle = '#fff5dc';
			circle(0, -1, 9);
			ctx.strokeStyle = '#252f39';
			circle(0, -1, 9, false);
			ctx.fillStyle = '#283442';
			ctx.textAlign = 'center';
			ctx.font = '700 12px SUIT, sans-serif';
			ctx.fillText('T', 0, 3);
			line([
				[-10, 12],
				[10, 12]
			]);
		} else if (['thock', 'thock2', 'thock3', 'thock4', 'clicky'].includes(type)) {
			ctx.fillStyle = '#ffffff77';
			rounded(-11, -12, 22, 21, 4);
			ctx.fill();
			ctx.stroke();
			ctx.fillStyle = '#36435b';
			ctx.textAlign = 'center';
			ctx.font = '700 12px SUIT, sans-serif';
			ctx.fillText({ thock: '1', thock2: '2', thock3: '3', thock4: '4', clicky: 'K' }[type], 0, 3);
			line([
				[-8, 11],
				[8, 11]
			]);
		} else if (type === 'switch') {
			ctx.fillStyle = '#465563';
			rounded(-8, -12, 16, 24, 3);
			ctx.fill();
			ctx.fillStyle = '#fff3c7';
			rounded(-6, -10 + (1 - fade) * 12, 12, 12, 2);
			ctx.fill();
			ctx.fillStyle = '#80c49d';
			circle(0, 7, 2);
		} else if (type === 'waxball' || type === 'popit' || type === 'bubble') {
			const gradient = ctx.createRadialGradient(-4, -5, 1, 1, 1, 14);
			gradient.addColorStop(0, type === 'popit' && fade < 1 ? '#51416a' : '#ffffffdd');
			gradient.addColorStop(0.4, color);
			gradient.addColorStop(1, '#44507188');
			ctx.fillStyle = gradient;
			circle(0, 0, 12);
			ctx.strokeStyle = '#ffffff88';
			circle(0, 0, 10, false);
			if (type === 'waxball') {
				ctx.strokeStyle = '#90466aaa';
				ctx.lineWidth = 1 + (1 - fade) * 2;
				if (fade < 1)
					line([
						[-11, -9],
						[0, 0],
						[10, 10]
					]);
				line([
					[-7, -5],
					[-2, 0],
					[-5, 5],
					[3, 8],
					[7, 3],
					[2, 0],
					[6, -7]
				]);
			}
			if (type === 'popit') {
				ctx.strokeStyle = '#65508180';
				circle(1, 2, 7, false);
			}
		} else if (type === 'wrap' || type === 'foam') {
			for (let row = 0; row < 3; row++)
				for (let col = 0; col < 3; col++) {
					ctx.fillStyle = type === 'wrap' ? '#ffffffaa' : '#b3714b60';
					circle(-9 + col * 9, -9 + row * 9, type === 'wrap' ? 3.5 * fade : 2 + ((row + col) % 2));
					if (type === 'wrap') {
						ctx.strokeStyle = '#608d9e88';
						circle(-9 + col * 9, -9 + row * 9, 3.5 * fade, false);
					}
				}
		} else if (type === 'waxbutter') {
			ctx.fillStyle = '#fff3bd';
			rounded(-11, -10, 22, 20, 3);
			ctx.fill();
			ctx.strokeStyle = '#b78a38aa';
			ctx.lineWidth = 1 + (1 - fade) * 3;
			line([
				[-13, -3],
				[-5, 0],
				[-2, -4],
				[3, 3],
				[12, 1]
			]);
			line([
				[3, 3],
				[1, 12]
			]);
		} else if (type === 'slime') {
			ctx.strokeStyle = '#467c4788';
			line([
				[-12, 4],
				[-7, 8],
				[0, 6],
				[6, 9],
				[12, 4]
			]);
			ctx.fillStyle = '#ffffff99';
			circle(-5, -6, 3);
			circle(5, 0, 2);
		} else if (type === 'wood') {
			for (let row = -9; row <= 9; row += 6)
				line([
					[-12, row],
					[-3, row + 2],
					[5, row - 1],
					[12, row]
				]);
		} else if (type === 'sand') {
			for (let i = 0; i < 25; i++)
				ctx.fillRect(-12 + ((i * 7) % 25), -12 + ((i * 11) % 25), 1.5, 1.5);
		} else if (type === 'soap') {
			ctx.strokeStyle = '#fff4f0cc';
			ctx.lineWidth = 2;
			for (let i = -8; i <= 8; i += 8)
				line([
					[-12, i - 3],
					[12, i + 3]
				]);
			ctx.fillStyle = '#fff4f090';
			rounded(-7, -5, 14, 10, 3);
			ctx.fill();
		} else if (type === 'glass' || type === 'ice') {
			ctx.strokeStyle = '#ffffffbb';
			line([
				[-10, 5],
				[4, -9]
			]);
			line([
				[-3, 9],
				[10, -5]
			]);
			if (type === 'ice') {
				ctx.strokeStyle = '#ffffff88';
				line([
					[0, -14],
					[-5, -3],
					[3, 3],
					[-3, 14]
				]);
			}
		}
		ctx.restore();
	}

	return drawTile;
}
