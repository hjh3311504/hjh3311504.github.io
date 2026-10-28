<script>
	import { Button } from '$lib/components/ui';
	import { STAT_ICONS } from '../text.js';

	// 설명 문장 조각을 글자와 타일(스킬·증강·아이템·능력치)로 보여 준다.
	// 타일과 뒤 조사 사이에 빈칸이 생기지 않도록 태그 사이에 줄바꿈을 두지 않는다.
	// onselect가 없으면(증강 공략의 설명처럼 효과를 열 곳이 없으면) 증강도 버튼이 아닌 타일로 보여 준다.
	let { parts, champion, guide, expanded = null, onselect } = $props();
</script>

{#snippet icon(src, size = 24)}<img
		{src}
		alt=""
		width={size}
		height={size}
		loading="lazy"
		decoding="async"
	/>{/snippet}

{#each parts as part, index (index)}{#if part.t === 'skill' && champion.skills[part.key]}{@const skill =
			champion.skills[part.key]}{#if part.short}<span
				class="aram-ic aram-ic-key-only"
				title={`${part.key} ${skill.name}`}
				>{@render icon(skill.icon)}<span class="aram-key">{part.key}</span></span
			>{:else}<span class="aram-ic" title={`${part.key} 스킬`}
				>{@render icon(skill.icon)}<span class="aram-key">{part.key}</span>{skill.name}</span
			>{/if}{:else if part.t === 'aug' && guide.augments[part.id]}{@const augment =
			guide.augments[part.id]}{#if onselect}<Button
				class="aram-ic aram-ic-button"
				variant="ghost"
				aria-expanded={expanded === part.id}
				onclick={() => onselect(part.id)}
				><span class={`aram-ring aram-ring-small aram-ring-${augment.tier}`}
					>{@render icon(augment.icon)}</span
				>{part.label || augment.nameKo}</Button
			>{:else}<span class="aram-ic"
				><span class={`aram-ring aram-ring-small aram-ring-${augment.tier}`}
					>{@render icon(augment.icon)}</span
				>{part.label || augment.nameKo}</span
			>{/if}{:else if part.t === 'item'}<span class="aram-ic"
			>{#if guide.items[part.v]}{@render icon(guide.items[part.v])}{/if}{part.v}</span
		>{:else if part.t === 'stat'}<span class="aram-ic"
			><span class="aram-stat-icon">{@render icon(guide.icons[STAT_ICONS[part.v]], 16)}</span
			>{part.v}</span
		>{:else if part.t === 'anvil'}<span class="aram-ic"
			>{@render icon(guide.icons.anvil)}{part.v}</span
		>{:else}{part.v ?? part.key}{/if}{/each}
