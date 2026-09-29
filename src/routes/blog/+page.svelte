<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import SiteShell from '$lib/components/organisms/SiteShell.svelte';
	import ToolPageLayout from '$lib/components/organisms/ToolPageLayout.svelte';
	import ToolPageFooter from '$lib/components/organisms/ToolPageFooter.svelte';
	import {
		Button,
		EmptyState,
		FilterList,
		Pager,
		Section,
		SectionHeader
	} from '$lib/components/ui';
	import BlogSeo from '$lib/blog/BlogSeo.svelte';
	import PostList from '$lib/blog/PostList.svelte';
	import { blogTitle, blogDescription, categories } from '$lib/blog/catalog.js';
	import { blogListing } from '$lib/blog/listing.js';

	let { data } = $props();
	let ready = $state(false);
	let resultsRegion;
	onMount(() => {
		ready = true;
	});
	let listing = $derived(
		blogListing(
			data.posts,
			ready ? (page.url.searchParams.get('category') ?? '') : '',
			ready ? (page.url.searchParams.get('page') ?? '1') : '1'
		)
	);
	let categoryCounts = $derived(
		Object.entries(categories)
			.map(([id, name]) => ({
				id,
				name,
				count: data.posts.filter((post) => post.category === id).length
			}))
			.filter((item) => item.count > 0)
	);
	let categoryItems = $derived([
		{ value: '', label: '전체 글', count: data.posts.length },
		...categoryCounts.map(({ id, name, count }) => ({ value: id, label: name, count }))
	]);

	async function navigate(category, currentPage = 1) {
		const query = [];
		if (category) query.push(`category=${encodeURIComponent(category)}`);
		if (currentPage > 1) query.push(`page=${currentPage}`);
		// resolve로 기본 경로를 처리한 뒤 목록 조건을 붙인다.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(`${resolve('/blog')}${query.length ? `?${query.join('&')}` : ''}`, {
			noScroll: true
		});
		resultsRegion?.focus({ preventScroll: true });
		resultsRegion?.scrollIntoView({ block: 'start' });
	}
</script>

<BlogSeo />
<SiteShell active="blog">
	<ToolPageLayout title={blogTitle} description={blogDescription} maxWidth="1200px">
		<div class="ui-sidebar-layout" data-sidebar="true">
			<aside class="ui-sidebar-aside" aria-label="카테고리">
				<Section variant="card" padding="compact" gap="body">
					<SectionHeader title="카테고리" titleId="categories-title" />
					<FilterList
						items={categoryItems}
						value={listing.category}
						disabled={!ready}
						labelledBy="categories-title"
						onchange={(category) => navigate(category)}
					/>
				</Section>
			</aside>
			<section
				class="blog-results ui-content-stack ui-sidebar-main"
				aria-label="블로그 글"
				tabindex="-1"
				bind:this={resultsRegion}
			>
				{#if !data.posts.length}
					<Section variant="card" padding="card"
						><EmptyState
							title="첫 이야기를 준비하고 있어요"
							description="새로운 글로 곧 찾아뵙겠습니다."
						/></Section
					>
				{:else if listing.total}
					<PostList posts={ready ? listing.posts : data.posts} />
				{:else}
					<Section variant="card" padding="card">
						<EmptyState
							title="아직 이 카테고리에 글이 없습니다"
							description="다른 카테고리의 글을 살펴보세요."
						>
							{#snippet actions()}<Button onclick={() => navigate('')}>전체 글 보기</Button
								>{/snippet}
						</EmptyState>
					</Section>
				{/if}
				{#if ready && listing.total}
					<Pager
						currentPage={listing.currentPage}
						pageCount={listing.pageCount}
						pages={listing.pages}
						label="글 목록 페이지"
						onchange={(number) => navigate(listing.category, number)}
					/>
				{/if}
				{#if data.drafts.length}
					<Section gap="body" aria-labelledby="drafts-title">
						<SectionHeader
							title="로컬 초안 미리보기"
							titleId="drafts-title"
							description="아래 글은 배포되지 않습니다. 공개 저장소에 올린 원문은 누구나 볼 수 있습니다."
						/>
						<PostList posts={data.drafts} label="로컬 초안 목록" />
					</Section>
				{/if}
			</section>
		</div>
		<div class="ui-content-width" data-sidebar="true"><ToolPageFooter showRss /></div>
	</ToolPageLayout>
</SiteShell>

<style>
	.blog-results {
		scroll-margin-top: var(--space-48);
	}
	.blog-results:focus-visible {
		outline: 2px solid var(--ui-focus);
		outline-offset: 4px;
	}
</style>
