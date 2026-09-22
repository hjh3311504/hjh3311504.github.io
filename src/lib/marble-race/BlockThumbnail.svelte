<script>
	import { createTilePainter } from './tile-painter.js';
	import { drawSpecialBlock } from './special-painter.js';
	import { drawPulse } from './pulse-painter.js';
	import { drawSkillIcon } from './skill-icons.js';
	import { SPECIAL_TYPES } from './catalog.js';

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
			if (currentType === 'pulse') {
				ctx.save();
				ctx.translate(16, 16);
				ctx.scale(0.16, 0.16);
				drawPulse(ctx, { x: 0, y: 0, color: '#428be6' }, 0.45);
				ctx.fillStyle = '#428be6';
				ctx.beginPath();
				ctx.arc(0, 0, 26, 0, Math.PI * 2);
				ctx.fill();
				ctx.restore();
			} else if (currentType === 'lightning' || currentType === 'gust') {
				drawSkillIcon(ctx, currentType);
			} else if (SPECIAL_TYPES.includes(currentType)) {
				ctx.save();
				ctx.translate(16, 16);
				const shape =
					currentType === 'butter'
						? { w: 120, h: 64, cornerRadius: 16 }
						: currentType === 'frost'
							? { w: 160, h: 28, cornerRadius: 8 }
							: { w: 152, h: 140, cornerRadius: 0 };
				const scale = currentType === 'butter' ? 0.22 : 0.18;
				ctx.scale(scale, scale);
				if (currentType !== 'pond') ctx.rotate(Math.PI / 6);
				drawSpecialBlock(ctx, { type: currentType, ...shape });
				ctx.restore();
			} else {
				drawTile({ type: currentType, x: 16, y: 16, w: 32, h: 32, cornerRadius: 10 });
			}
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

<span
	class="block-symbol"
	class:special-thumbnail={SPECIAL_TYPES.includes(type)}
	aria-hidden="true"
>
	{#if source}<img src={source} alt="" width="96" height="96" />{/if}
</span>
