<script>
	import { paintMarbleIcon } from '../icon-painter.js';
	let { id, color, active = true } = $props();
	let canvas;
	$effect(() => {
		if (!active) return;
		const number = id,
			fill = color;
		let disposed = false;
		const draw = () => {
			if (disposed) return;
			const quality = Math.min(window.devicePixelRatio || 1, 2);
			paintMarbleIcon(canvas, number, fill, quality);
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
