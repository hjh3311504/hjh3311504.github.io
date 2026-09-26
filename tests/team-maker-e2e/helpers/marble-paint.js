// 글자 캐시를 포함해 실제 경기 Canvas에 그려진 글자 좌표를 관찰한다.
export async function observeMarbleText(page) {
	await page.addInitScript(() => {
		const text = CanvasRenderingContext2D.prototype.fillText;
		const image = CanvasRenderingContext2D.prototype.drawImage;
		CanvasRenderingContext2D.prototype.fillText = function (value, x, y, ...args) {
			if (!this.canvas.isConnected && this.font.includes('SUIT')) {
				const t = this.getTransform();
				const bounds = this.measureText(value);
				this.canvas.__paintedText = {
					value,
					x: t.a * x + t.e,
					y: t.d * y + t.f,
					top: t.d * (y - bounds.actualBoundingBoxAscent) + t.f,
					bottom: t.d * (y + bounds.actualBoundingBoxDescent) + t.f
				};
				(this.canvas.__paintedTexts ??= []).push(this.canvas.__paintedText);
			} else if (this.canvas.getAttribute('role') === 'button')
				window.__onMarbleText?.(this, value, x, y);
			return text.call(this, value, x, y, ...args);
		};
		CanvasRenderingContext2D.prototype.drawImage = function (bitmap, ...args) {
			const label = bitmap.__paintedText;
			if (args.length === 8 && this.canvas.getAttribute('role') === 'button') {
				const [sx, sy, sw, sh, dx, dy, dw, dh] = args;
				for (const text of bitmap.__paintedTexts ?? []) {
					if (text.x < sx || text.x >= sx + sw || text.y < sy || text.y >= sy + sh) continue;
					window.__onMarbleText?.(
						this,
						text.value,
						dx + ((text.x - sx) * dw) / sw,
						dy + ((text.y - sy) * dh) / sh,
						{ top: text.top - sy, bottom: text.bottom - sy, height: sh, width: sw }
					);
				}
			}
			if (label && args.length === 4 && this.canvas.getAttribute('role') === 'button') {
				window.__onMarbleText?.(
					this,
					label.value,
					args[0] + (label.x * args[2]) / bitmap.width,
					args[1] + (label.y * args[3]) / bitmap.height,
					{ top: label.top, bottom: label.bottom, height: bitmap.height, width: bitmap.width }
				);
			}
			return image.call(this, bitmap, ...args);
		};
	});
}
