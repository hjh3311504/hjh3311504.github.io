<script>
	let { winners = [], reduced = false } = $props();
	const pieces = [...Array(36).keys()];
	const colors = ['#ffdc75', '#7ac4ff', '#ff9cb7', '#a7e5d0'];
</script>

<div class="winner-celebration" class:reduced aria-hidden="true">
	{#if !reduced}
		{#each pieces as i (i)}
			<i
				class="confetti"
				style={`--x:${(i * 37) % 100}%;--drift:${((i * 53) % 160) - 80}px;--delay:${(i % 6) * 35}ms;--turn:${180 + (i % 5) * 100}deg;background:${colors[i % colors.length]}`}
			></i>
		{/each}
	{/if}
	<div class="winner-banner">
		<span class="winner-star">✦</span>
		<div>
			<strong>당첨을 축하해요!</strong>
			<p>
				{winners
					.slice(0, 2)
					.map((winner) => winner.name)
					.join(' · ')}{winners.length > 2 ? ` 외${winners.length - 2}명` : ''}
			</p>
		</div>
		<span class="winner-star">✦</span>
	</div>
</div>

<style>
	.winner-celebration {
		position: absolute;
		inset: 0;
		z-index: 5;
		pointer-events: none;
		overflow: hidden;
	}
	.winner-banner {
		position: absolute;
		top: 12%;
		left: 50%;
		width: min(440px, 90%);
		padding: var(--space-20) var(--space-20);
		border: 1px solid var(--color-border-9);
		border-radius: 18px;
		background: var(--color-background-24);
		color: var(--color-white);
		box-shadow:
			0 8px 40px var(--color-box-shadow-19),
			0 0 28px var(--color-box-shadow-20);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-16);
		text-align: center;
		transform: translateX(-50%);
		animation: reveal 2.2s ease both;
	}
	.winner-banner > div {
		min-width: 0;
	}
	strong {
		font-size: var(--font-size-24);
	}
	p {
		margin: var(--space-8) 0 0;
		font-size: var(--font-size-20);
		font-weight: 700;
		overflow-wrap: anywhere;
	}
	.winner-star {
		color: var(--color-border-9);
		font-size: var(--font-size-32);
	}
	.confetti {
		position: absolute;
		left: var(--x);
		top: -16px;
		width: 8px;
		height: 14px;
		border-radius: 2px;
		animation: confetti 2s var(--delay) cubic-bezier(0.18, 0.6, 0.6, 1) both;
	}
	@keyframes confetti {
		from {
			transform: translate(0, -20px) rotate(0);
			opacity: 1;
		}
		to {
			transform: translate(var(--drift), 560px) rotate(var(--turn));
			opacity: 0;
		}
	}
	@keyframes reveal {
		0% {
			opacity: 0;
			transform: translate(-50%, 12px) scale(0.9);
		}
		15%,
		80% {
			opacity: 1;
			transform: translate(-50%, 0) scale(1);
		}
		100% {
			opacity: 0;
			transform: translate(-50%, -8px) scale(1);
		}
	}
	.reduced .winner-banner {
		animation: none;
	}
	@media (prefers-reduced-motion: reduce) {
		.confetti {
			display: none;
		}
		.winner-banner {
			animation: none;
		}
	}
	@media (max-width: 600px) {
		.winner-banner {
			gap: var(--space-8);
			padding: var(--space-16) var(--space-12);
		}
		strong {
			font-size: var(--font-size-20);
		}
		p {
			font-size: var(--font-size-18);
		}
		.winner-star {
			font-size: var(--font-size-24);
		}
	}
</style>
