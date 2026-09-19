<script>
	import VirtualList from './VirtualList.svelte';
	let { winners = [], celebrating = false, reduced = false } = $props();
</script>

{#if winners.length}
	<aside class:celebrating={celebrating && !reduced} class="winner-panel" aria-label="확정 당첨자">
		<strong>🎉 당첨 {winners.length}명</strong>
		<VirtualList items={winners} height={160} rowHeight={38} label="확정 당첨 목록"
			>{#snippet children(winner, index)}<span>{index + 1}.</span><i style:background={winner.color}
				></i><span>{winner.name}</span><small>{winner.id + 1}번</small>{/snippet}</VirtualList
		>
	</aside>
{/if}

<style>
	.winner-panel {
		position: absolute;
		right: 10px;
		bottom: 12px;
		width: min(230px, 58%);
		border: 1px solid #86dfc5;
		background: #102c35ef;
		color: #fff;
		border-radius: 12px;
		z-index: 3;
		padding: 10px;
		box-shadow: 0 6px 24px #0004;
	}
	strong {
		font-size: 16px;
	}
	i {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		flex: none;
	}
	small {
		margin-left: auto;
		font-size: 12px;
	}
	.celebrating {
		animation: celebrate 0.6s ease-out;
	}
	@keyframes celebrate {
		0% {
			box-shadow: 0 0 0 0 #fcda79aa;
			transform: scale(0.96);
		}
		60% {
			box-shadow: 0 0 0 18px #fcda7900;
			transform: scale(1.03);
		}
		100% {
			transform: scale(1);
		}
	}
</style>
