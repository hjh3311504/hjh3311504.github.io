<script>
	import { resolve } from '$app/paths';
	import { Section, SectionHeader } from '$lib/components/ui';
	import { programs, categories, formatDate } from './catalog.js';
	let { posts, label = '글 목록' } = $props();
</script>

<ul class="post-list" aria-label={label}>
	{#each posts as post (post.slug)}
		<li>
			<Section variant="card" padding="card" gap="body">
				<div class="post-meta ui-meta">
					{#if post.program}<span>{programs[post.program].name}</span>{/if}<span
						>{categories[post.category]}</span
					>
					<time datetime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
				</div>
				<SectionHeader>
					{#snippet heading()}<h2>
							<a href={resolve('/blog/[slug]', { slug: post.slug })}>{post.title}</a>
						</h2>{/snippet}
				</SectionHeader>
				<p>{post.summary}</p>
			</Section>
		</li>
	{/each}
</ul>

<style>
	.post-list {
		display: grid;
		gap: var(--space-16);
		list-style: none;
		padding: 0;
		margin: 0;
		min-width: 0;
	}
	.post-meta {
		line-height: 1.6;
	}
	h2 {
		font-size: var(--font-size-22);
		line-height: 1.5;
	}
	p {
		color: var(--ui-text-muted);
		font-size: var(--font-size-16);
		line-height: 1.8;
	}
	a {
		text-decoration: none;
	}
	a:hover {
		text-decoration: underline;
	}
	a:focus-visible {
		outline: 2px solid var(--ui-focus);
		outline-offset: 2px;
	}
</style>
