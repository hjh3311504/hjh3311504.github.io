<script>
	import {
		blogTitle,
		blogDescription,
		absoluteUrl,
		postPath,
		postImage,
		structuredPost,
		dateTime,
		author
	} from './catalog.js';
	import { image } from '$lib/data/meta.js';
	let { post = undefined } = $props();
	let title = $derived(post?.title || blogTitle);
	let description = $derived(post?.summary || blogDescription);
	let url = $derived(absoluteUrl(post ? postPath(post.slug) : '/blog'));
	let share = $derived(
		post ? postImage(post) : { url: image, alt: 'Lake의 개발 도구와 프로젝트를 소개하는 사이트' }
	);
	// 글 정보의 < 문자를 이스케이프해 JSON-LD의 script 종료를 막는다.
	let jsonLd = $derived(
		post?.published
			? `<script type="application/ld+json">${JSON.stringify(structuredPost(post)).replaceAll('<', '\\u003c')}<` +
					'/script>'
			: ''
	);
</script>

<svelte:head>
	<title>{title} | Lake's develog</title>
	<meta name="description" content={description} />
	<meta
		name="robots"
		content={post && !post.published
			? 'noindex, nofollow'
			: 'index, follow, max-image-preview:large'}
	/>
	{#if !post || post.published}<link rel="canonical" href={url} />{/if}
	<link
		rel="alternate"
		type="application/rss+xml"
		title="블로그 RSS"
		href={absoluteUrl('/rss.xml')}
	/>
	<meta property="og:type" content={post ? 'article' : 'website'} />
	<meta property="og:locale" content="ko_KR" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={share.url} />
	<meta property="og:image:alt" content={share.alt} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={share.url} />
	<meta name="twitter:image:alt" content={share.alt} />
	{#if post}
		<meta name="author" content={author.name} />
		<meta property="article:published_time" content={dateTime(post.publishedAt)} />
		{#if post.updatedAt}<meta
				property="article:modified_time"
				content={dateTime(post.updatedAt)}
			/>{/if}
	{/if}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html jsonLd}
</svelte:head>
