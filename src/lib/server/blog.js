import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import { parseDocument } from 'yaml';
import { programs, categories, postPath } from '../blog/catalog.js';

const allowedFields = new Set([
	'slug',
	'title',
	'summary',
	'program',
	'category',
	'publishedAt',
	'updatedAt',
	'published',
	'image',
	'imageAlt',
	'releaseDate',
	'version'
]);

function fail(file, reason) {
	throw new Error(`${file}: ${reason}`);
}

function dateValue(value, field, file) {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
		fail(file, `${field}는 YYYY-MM-DD 형식이어야 합니다.`);
	const parsed = new Date(`${value}T00:00:00Z`);
	if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value)
		fail(file, `${field}에 존재하지 않는 날짜가 있습니다.`);
	return value;
}

async function validateImage(url, staticDir, file) {
	if (
		typeof url !== 'string' ||
		!/^\/images\/[a-zA-Z0-9/_\-.]+$/.test(url) ||
		url.split('/').includes('..')
	) {
		fail(file, '이미지는 /images/ 아래 로컬 경로를 사용하세요.');
	}
	try {
		if (!(await stat(path.join(staticDir, url))).isFile()) throw new Error();
	} catch {
		fail(file, `이미지 파일이 없습니다: ${url}`);
	}
}

/** 원시 HTML을 실행하지 않는 Markdown만 허용한다. 렌더러는 서버에서만 실행한다. */
export async function parsePost(
	source,
	file,
	{ staticDir = path.resolve('static'), now = new Date() } = {}
) {
	const match = source.replaceAll('\r\n', '\n').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!match) fail(file, '파일 첫머리에 ---로 감싼 YAML 글 정보가 필요합니다.');
	const document = parseDocument(match[1]);
	if (document.errors.length || document.warnings.length)
		fail(file, `글 정보 형식 오류: ${(document.errors[0] || document.warnings[0]).message}`);
	let data;
	try {
		data = document.toJS({ maxAliasCount: 0 });
	} catch (error) {
		fail(file, `글 정보 형식 오류: ${error.message}`);
	}
	if (!data || typeof data !== 'object' || Array.isArray(data))
		fail(file, '글 정보는 항목과 값으로 작성하세요.');
	for (const key of Object.keys(data))
		if (!allowedFields.has(key)) fail(file, `알 수 없는 글 정보: ${key}`);
	for (const key of ['slug', 'title', 'summary', 'category', 'publishedAt']) {
		if (typeof data[key] !== 'string' || !data[key].trim())
			fail(file, `${key}는 비어 있지 않은 문자열이어야 합니다.`);
		data[key] = data[key].trim();
	}
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug))
		fail(file, 'slug는 소문자 영문·숫자와 하이픈으로 작성하세요.');
	if (
		data.program !== undefined &&
		(typeof data.program !== 'string' || !Object.hasOwn(programs, data.program))
	)
		fail(file, `없는 프로그램 ID: ${data.program}`);
	if (!Object.hasOwn(categories, data.category))
		fail(file, `허용하지 않은 글 종류: ${data.category}`);
	if (typeof data.published !== 'boolean') fail(file, 'published는 true 또는 false를 명시하세요.');
	dateValue(data.publishedAt, 'publishedAt', file);
	const today = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Asia/Seoul',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(now);
	if (data.published && data.publishedAt > today)
		fail(file, '미래 게시일의 글은 공개할 수 없습니다.');
	if (data.updatedAt !== undefined) {
		dateValue(data.updatedAt, 'updatedAt', file);
		if (data.updatedAt < data.publishedAt) fail(file, '수정일은 게시일보다 빠를 수 없습니다.');
		if (data.published && data.updatedAt > today) fail(file, '미래 수정일을 사용할 수 없습니다.');
	}
	if (data.releaseDate !== undefined) dateValue(data.releaseDate, 'releaseDate', file);
	if (data.version !== undefined && (typeof data.version !== 'string' || !data.version.trim()))
		fail(file, 'version은 비어 있지 않은 문자열이어야 합니다.');
	if (data.image !== undefined) {
		await validateImage(data.image, staticDir, file);
		if (typeof data.imageAlt !== 'string' || !data.imageAlt.trim())
			fail(file, '대표 이미지에 imageAlt 설명이 필요합니다.');
	} else if (data.imageAlt !== undefined) fail(file, 'imageAlt를 작성하려면 image가 필요합니다.');
	const body = match[2].trim();
	if (!body) fail(file, '글 본문이 비어 있습니다.');
	const md = new MarkdownIt({ html: false });
	const tokens = md.parse(body, {});
	const toc = [];
	for (let index = 0; index < tokens.length; index++) {
		const token = tokens[index];
		if (token.type === 'heading_open') {
			if (token.tag === 'h1')
				fail(file, '본문 제목은 ##부터 작성하세요. 페이지 제목은 글 정보에서 표시합니다.');
			const id = `section-${toc.length + 1}`;
			token.attrSet('id', id);
			const text = tokens[index + 1].children
				.filter((child) => ['text', 'code_inline'].includes(child.type))
				.map((child) => child.content)
				.join('');
			toc.push({ id, text, level: Number(token.tag.slice(1)) });
		}
		for (const child of token.children || []) {
			if (child.type === 'image') {
				await validateImage(child.attrGet('src'), staticDir, file);
				if (!child.content.trim()) fail(file, '본문 이미지에 대체 텍스트가 필요합니다.');
				child.attrSet('loading', 'lazy');
				child.attrSet('decoding', 'async');
			}
		}
		const image = token.children?.length === 1 ? token.children[0] : undefined;
		const caption = image?.type === 'image' ? image.attrGet('title')?.trim() : undefined;
		if (
			caption &&
			tokens[index - 1]?.type === 'paragraph_open' &&
			tokens[index + 1]?.type === 'paragraph_close'
		) {
			const open = tokens[index - 1];
			const close = tokens[index + 1];
			open.type = 'figure_open';
			open.tag = 'figure';
			open.hidden = false;
			close.type = 'figure_close';
			close.tag = 'figure';
			close.hidden = false;
			close.meta = { caption };
			image.attrs.splice(image.attrIndex('title'), 1);
		}
	}
	md.renderer.rules.figure_close = (tokens, index) =>
		`<figcaption>${md.utils.escapeHtml(tokens[index].meta.caption)}</figcaption></figure>\n`;
	md.renderer.rules.table_open = () =>
		'<div class="blog-table-scroll" role="region" aria-label="본문 표, 가로 스크롤" tabindex="0"><table>\n';
	md.renderer.rules.table_close = () => '</table></div>\n';
	const codeBlock = md.renderer.rules.code_block;
	md.renderer.rules.code_block = (...args) =>
		`<div class="blog-code-scroll" role="region" aria-label="코드 예시, 가로 스크롤" tabindex="0">${codeBlock(...args)}</div>`;
	const fence = md.renderer.rules.fence;
	md.renderer.rules.fence = (...args) =>
		`<div class="blog-code-scroll" role="region" aria-label="코드 예시, 가로 스크롤" tabindex="0">${fence(...args)}</div>`;
	return { ...data, file, body, html: md.renderer.render(tokens, md.options, {}), toc };
}

export async function readPosts({ directory = path.resolve('content/blog'), staticDir, now } = {}) {
	let files;
	try {
		files = await readdir(directory);
	} catch (error) {
		if (error.code === 'ENOENT') return [];
		throw error;
	}
	const names = files.filter((name) => name.endsWith('.md')).sort();
	const posts = [];
	const slugs = new Map();
	for (const name of names) {
		const file = path.join(directory, name);
		const post = await parsePost(await readFile(file, 'utf8'), file, { staticDir, now });
		if (slugs.has(post.slug)) fail(file, `중복 slug ${post.slug}: ${slugs.get(post.slug)}`);
		slugs.set(post.slug, file);
		posts.push(post);
	}
	return posts.sort(
		(a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug)
	);
}

export function summarizePost(post) {
	return Object.fromEntries(Object.entries(post).filter(([key]) => allowedFields.has(key)));
}

export async function publicPosts() {
	return (await readPosts()).filter((post) => post.published).map(summarizePost);
}

export function relatedPosts(posts, current) {
	return posts
		.filter(
			(post) =>
				post.published &&
				post.slug !== current.slug &&
				(current.program
					? post.program === current.program
					: !post.program && post.category === current.category)
		)
		.sort(
			(a, b) =>
				Number(b.category === 'introduction') - Number(a.category === 'introduction') ||
				b.publishedAt.localeCompare(a.publishedAt)
		)
		.slice(0, 4)
		.map(summarizePost);
}

export const publicEntries = (posts) =>
	posts.filter((post) => post.published).map(({ slug }) => ({ slug }));
export const publicPaths = (posts) => publicEntries(posts).map(({ slug }) => postPath(slug));
