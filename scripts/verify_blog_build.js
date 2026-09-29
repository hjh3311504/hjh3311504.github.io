import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { readPosts } from '../src/lib/server/blog.js';
import { absoluteUrl, postPath, xmlEscape } from '../src/lib/blog/catalog.js';

async function textFiles(directory) {
	const files = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const file = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await textFiles(file)));
		else if (/\.(html|js|mjs|json|xml|map|md)$/.test(file)) files.push(file);
	}
	return files;
}

export async function verifyBlogBuild({ root = process.cwd() } = {}) {
	const posts = await readPosts({
		directory: path.join(root, 'content/blog'),
		staticDir: path.join(root, 'static')
	});
	const published = posts.filter((post) => post.published);
	const build = path.join(root, 'build');
	const listing = await readFile(path.join(build, 'blog.html'), 'utf8');
	const sitemap = await readFile(path.join(build, 'sitemap.xml'), 'utf8');
	const feed = await readFile(path.join(build, 'rss.xml'), 'utf8');
	assert.ok(/<h1\b[^>]*>블로그<\/h1>/.test(listing), '블로그 제목이 정적 HTML에 없습니다.');
	assert.ok(
		sitemap.includes(`<loc>${absoluteUrl('/blog')}</loc>`),
		'sitemap에 블로그 목록이 없습니다.'
	);
	assert.ok(feed.includes('<rss version="2.0"'), 'RSS 형식이 잘못됐습니다.');
	for (const post of published) {
		const url = absoluteUrl(postPath(post.slug));
		const html = await readFile(path.join(build, `blog/${post.slug}.html`), 'utf8');
		assert.ok(
			[...listing.matchAll(/href="([^"]+)"/g)].some(
				(match) => new URL(match[1], absoluteUrl('/blog')).href === url
			),
			`${post.slug}: 목록 링크 누락`
		);
		assert.ok(html.includes(post.html.trim()), `${post.slug}: 정적 본문 누락`);
		assert.ok(html.includes(`rel="canonical" href="${url}"`), `${post.slug}: 대표 주소 오류`);
		assert.ok(
			!/<meta name="robots" content="[^"]*(?:noindex|nosnippet)/.test(html),
			`${post.slug}: 검색 차단`
		);
		const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
		assert.ok(json, `${post.slug}: 구조화 데이터 누락`);
		const schema = JSON.parse(json[1]);
		assert.equal(schema.headline, post.title);
		assert.equal(schema.url, url);
		assert.ok(sitemap.includes(`<loc>${url}</loc>`), `${post.slug}: sitemap 누락`);
		assert.ok(feed.includes(`<guid isPermaLink="true">${url}</guid>`), `${post.slug}: RSS 누락`);
	}
	const artifacts = await Promise.all(
		(await textFiles(build)).map(async (file) => ({ file, text: await readFile(file, 'utf8') }))
	);
	for (const draft of posts.filter((post) => !post.published)) {
		await assert.rejects(
			access(path.join(build, `blog/${draft.slug}.html`)),
			`${draft.slug}: 초안 HTML이 배포됩니다.`
		);
		const markers = [
			postPath(draft.slug),
			draft.title,
			draft.summary,
			draft.body,
			draft.html.trim()
		].filter(
			(value) =>
				!published.some((post) =>
					[post.title, post.summary, post.body, post.html.trim()].includes(value)
				)
		);
		for (const { file, text } of artifacts) {
			for (const marker of markers) {
				const jsonMarker = JSON.stringify(marker).slice(1, -1);
				const variants = [
					marker,
					xmlEscape(marker),
					jsonMarker,
					jsonMarker.replaceAll('<', '\\u003c'),
					jsonMarker.replaceAll('<', '\\u003C')
				];
				assert.ok(
					!variants.some((value) => text.includes(value)),
					`${file}: 초안 ${draft.slug}의 내용이 포함됐습니다.`
				);
			}
		}
	}
	console.log(
		`블로그 정적 결과 검증 통과: 공개 ${published.length}개, 초안 ${posts.length - published.length}개 제외`
	);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
	await verifyBlogBuild();
