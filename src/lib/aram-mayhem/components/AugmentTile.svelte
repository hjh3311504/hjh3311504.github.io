<script>
	import { Button } from '$lib/components/ui';
	import { TIER_LABEL } from '../guide.js';

	// kind: need(필수 증강, 실선) | opt(선택 증강, 점선) | ''(일반)
	let { id, augment, kind = '', small = false, expanded = false, onselect } = $props();
	let title = $derived(
		`${TIER_LABEL[augment.tier]} 증강${kind === 'need' ? ' · 필수' : kind === 'opt' ? ' · 선택' : ''}`
	);
</script>

<Button
	class={['aram-aug', kind && `aram-aug-${kind}`, small && 'aram-aug-small']
		.filter(Boolean)
		.join(' ')}
	variant="ghost"
	{title}
	aria-expanded={expanded}
	onclick={() => onselect(id)}
>
	<span class={`aram-ring aram-ring-${augment.tier}`}>
		<img src={augment.icon} alt="" width="44" height="44" loading="lazy" decoding="async" />
	</span>
	{augment.nameKo}
</Button>
