<script>
	import { drawMarble } from '../marble-painter.js';
	let { id, color, active = true } = $props();
	let canvas;
	$effect(() => {
		if (!active) return;
		const marble = { id, color, r: 18 };
		let disposed = false;
		const draw = () => {
			if (disposed) return;
			const quality = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = canvas.height = 36 * quality;
			const ctx = canvas.getContext('2d');
			if (!ctx) return;
			ctx.scale(quality, quality);
			ctx.translate(18, 18);
			let size = 12;
			ctx.font = `800 ${size}px SUIT, sans-serif`;
			while (size > 4 && ctx.measureText(String(id + 1)).width > 30) {
				size -= 2;
				ctx.font = `800 ${size}px SUIT, sans-serif`;
			}
			drawMarble(ctx, marble, ctx.font);
		};
		draw();
		if (document.fonts.status !== 'loaded') void document.fonts.ready.then(draw);
		return () => {
			disposed = true;
		};
	});
</script>

<canvas bind:this={canvas} class="marble-icon" width="36" height="36" aria-hidden="true"></canvas>

<style>
	.marble-icon {
		width: 36px;
		height: 36px;
		flex: none;
	}
</style>
