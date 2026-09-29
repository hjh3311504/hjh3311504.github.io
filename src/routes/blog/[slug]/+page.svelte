<script>
	import { resolve } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	import SiteShell from '$lib/components/organisms/SiteShell.svelte';
	import ToolPageLayout from '$lib/components/organisms/ToolPageLayout.svelte';
	import ToolPageFooter from '$lib/components/organisms/ToolPageFooter.svelte';
	import { Button, Section, SectionHeader } from '$lib/components/ui';
	import BlogSeo from '$lib/blog/BlogSeo.svelte';
	import PostList from '$lib/blog/PostList.svelte';
	import { author, programs, categories, formatDate } from '$lib/blog/catalog.js';
	import '$lib/blog/prose.css';
	let { data } = $props();
	let post = $derived(data.post);
	let program = $derived(programs[post.program]);
	let backHref = $state(resolve('/blog'));

	afterNavigate(({ from, to }) => {
		// 목차 이동은 이전 페이지를 바꾸지 않는다. 직접 접속하면 블로그 목록을 사용한다.
		if (from && to && from.url.pathname !== to.url.pathname) {
			backHref = from.url.pathname + from.url.search + from.url.hash;
		}
	});
</script>

{#snippet backLink()}
	<!-- SvelteKit이 제공한 내부 경로나 resolve로 만든 블로그 목록 주소다. -->
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
	<a class="back-link" href={backHref}>뒤로가기</a>
{/snippet}

<BlogSeo {post} />
<SiteShell active="blog">
	<ToolPageLayout
		title={post.title}
		description={post.summary}
		maxWidth={post.toc.length >= 3 ? '1200px' : '880px'}
	>
		<article class="blog-article ui-content-stack" aria-label={post.title}>
			{#if !post.published}<p class="draft-notice" role="status">
					초안 미리보기 · 이 글은 배포되지 않습니다.
				</p>{/if}
			<div class="ui-action-row ui-content-width" data-sidebar={post.toc.length >= 3}>
				<div class="article-meta ui-meta">
					<!-- 작성자 프로필은 공통 설정의 외부 HTTPS 주소다. -->
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href={author.url} rel="author">{author.name}</a>
					<span>{categories[post.category]}</span>
					<span>게시 <time datetime={post.publishedAt}>{formatDate(post.publishedAt)}</time></span>
					{#if post.updatedAt}<span
							>수정 <time datetime={post.updatedAt}>{formatDate(post.updatedAt)}</time></span
						>{/if}
					{#if post.releaseDate}<span
							>적용 <time datetime={post.releaseDate}>{formatDate(post.releaseDate)}</time></span
						>{/if}
					{#if post.version}<span>버전 {post.version}</span>{/if}
				</div>
				{@render backLink()}
			</div>
			{#if post.image}<img class="post-cover" src={post.image} alt={post.imageAlt} />{/if}
			<div class="ui-sidebar-layout" data-sidebar={post.toc.length >= 3}>
				{#if post.toc.length >= 3}
					<aside class="article-toc ui-sidebar-aside" data-scroll="true" aria-label="목차">
						<Section variant="card" padding="card" gap="body" aria-labelledby="toc-title">
							<SectionHeader title="목차" titleId="toc-title" />
							<nav aria-label="글 목차">
								<ul class="toc">
									{#each post.toc as item (item.id)}<li class:subheading={item.level > 2}>
											<a href={`#${item.id}`}>{item.text}</a>
										</li>{/each}
								</ul>
							</nav>
						</Section>
					</aside>
				{/if}
				<Section class="ui-sidebar-main" variant="card" padding="card" aria-label="글 본문">
					<div class="blog-prose">
						<!-- 원시 HTML을 허용하지 않는 서버 전용 Markdown 렌더러의 결과만 표시한다. -->
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html post.html}
					</div>
				</Section>
			</div>
			{#if data.related.length}
				<Section gap="body" aria-labelledby="related-title">
					<SectionHeader title="함께 읽어보세요" titleId="related-title" />
					<PostList posts={data.related} label="관련 글" />
				</Section>
			{/if}
			<div class="ui-action-row ui-content-width" data-sidebar={post.toc.length >= 3}>
				{#if program}<Button variant="primary" href={program.href}>{program.name} 체험하기</Button
					>{/if}
				{@render backLink()}
			</div>
		</article>
		<div class="article-footer ui-content-width" data-sidebar={post.toc.length >= 3}>
			<ToolPageFooter showRss />
		</div>
	</ToolPageLayout>
</SiteShell>

<style>
	.blog-article {
		font-size: var(--font-size-16);
		line-height: 1.8;
	}
	.article-toc {
		overflow-wrap: anywhere;
	}
	.article-meta {
		flex: 1;
		min-width: 0;
	}
	.draft-notice {
		padding: var(--space-16);
		background: var(--ui-surface-soft);
		border: 1px dashed var(--ui-border-strong);
		border-radius: 8px;
	}
	.post-cover {
		width: 100%;
		height: auto;
		border-radius: 8px;
	}
	.toc {
		display: grid;
		gap: var(--space-8);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.subheading {
		margin-left: var(--space-16);
	}
	.article-footer {
		margin-top: var(--space-24);
		border-top: 1px solid var(--ui-border);
	}
	.back-link {
		margin-left: auto;
		white-space: nowrap;
	}

	a:focus-visible {
		outline: 2px solid var(--ui-focus);
		outline-offset: 2px;
	}
</style>
