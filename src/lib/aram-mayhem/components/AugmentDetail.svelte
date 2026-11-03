<script>
	import { TIER_LABEL } from '../guide.js';

	let { augment } = $props();
</script>

{#if augment}
	<div class="aram-aug-detail">
		<strong>{augment.nameKo}</strong>
		<span class={`aram-tag aram-tier-badge aram-tier-badge-${augment.tier}`}
			>{TIER_LABEL[augment.tier]}</span
		>
		<p>{augment.effectKo}</p>
	</div>
{/if}
