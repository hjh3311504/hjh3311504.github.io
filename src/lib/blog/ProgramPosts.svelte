<script>
	import { resolve } from '$app/paths';
	import { Section, SectionHeader } from '$lib/components/ui';
	import { categories } from './catalog.js';
	let { posts = [] } = $props();
</script>

{#if posts.length}
	<Section
		variant="card"
		padding="card"
		gap="body"
		class="program-posts"
		aria-labelledby="program-posts-title"
	>
		<SectionHeader title="프로그램 이야기와 사용 가이드" titleId="program-posts-title" />
		<ul>
			{#each posts as post (post.slug)}
				<li>
					<span>{categories[post.category]}</span>
					<a href={resolve('/blog/[slug]', { slug: post.slug })}>{post.title}</a>
				</li>
			{/each}
		</ul>
	</Section>
{/if}

<style>
	:global(.program-posts) {
		margin-top: var(--space-32);
	}
	ul {
		display: grid;
		gap: var(--space-12);
		padding-left: var(--space-20);
		margin: 0;
		line-height: 1.8;
		font-size: var(--font-size-16);
	}
	span {
		color: var(--ui-text-muted);
		font-size: var(--font-size-14);
		margin-right: var(--space-8);
	}
	a {
		overflow-wrap: anywhere;
	}
	a:focus-visible {
		outline: 2px solid var(--ui-focus);
		outline-offset: 2px;
	}
</style>
