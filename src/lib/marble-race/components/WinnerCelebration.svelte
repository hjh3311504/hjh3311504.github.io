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
		padding: 18px 20px;
		border: 1px solid #ffdc75;
		border-radius: 18px;
		background: #102635f2;
		color: #fff;
		box-shadow:
			0 8px 40px #0005,
			0 0 28px #ffdc7533;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 16px;
		text-align: center;
		transform: translateX(-50%);
		animation: reveal 2.2s ease both;
	}
	.winner-banner > div {
		min-width: 0;
	}
	strong {
		font-size: 24px;
	}
	p {
		margin: 6px 0 0;
		font-size: 20px;
		font-weight: 700;
		overflow-wrap: anywhere;
	}
	.winner-star {
		color: #ffdc75;
		font-size: 32px;
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
			gap: 8px;
			padding: 14px 12px;
		}
		strong {
			font-size: 20px;
		}
		p {
			font-size: 18px;
		}
		.winner-star {
			font-size: 24px;
		}
	}
</style>
