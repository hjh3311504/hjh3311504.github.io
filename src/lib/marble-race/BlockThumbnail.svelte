<script>
	import { createTilePainter } from './tile-painter.js';

	let { type } = $props();
	let source = $state('');

	$effect(() => {
		const currentType = type;
		const canvas = document.createElement('canvas');
		canvas.width = canvas.height = 96;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const drawTile = createTilePainter(ctx);
		let disposed = false;
		const draw = () => {
			if (disposed) return;
			ctx.setTransform(3, 0, 0, 3, 0, 0);
			ctx.clearRect(0, 0, 32, 32);
			drawTile({ type: currentType, x: 16, y: 16, w: 32, h: 32, cornerRadius: 10 });
			source = canvas.toDataURL();
		};
		draw();
		// 키캡 문자는 경기장과 같은 로컬 글꼴이 준비되면 다시 그린다.
		void document.fonts.ready.then(draw);
		return () => {
			disposed = true;
		};
	});
</script>

<span class="block-symbol" aria-hidden="true">
	{#if source}<img src={source} alt="" width="96" height="96" />{/if}
</span>
