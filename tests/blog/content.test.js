import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { stringify } from 'yaml';
import {
	parsePost,
	readPosts,
	publicEntries,
	publicPaths,
	isPublicPost,
	relatedPosts,
	summarizePost
} from '../../src/lib/server/blog.js';
import { rss, structuredPost, postImage } from '../../src/lib/blog/catalog.js';
import { blogPrerenderGuard } from '../../scripts/blog_prerender.js';

const defaults = {
	slug: 'sample',
	title: '예시 글',
	summary: '글 요약',
	program: 'team-maker',
	category: 'introduction',
	publishedAt: '2026-09-29',
	published: true
};
const now = new Date('2026-09-29T12:00:00+09:00');

test('공개 글0개일 때만 상세 경로 미생성을 허용한다', () => {
	const details = { routes: ['/blog/[slug]'], message: '경로 누락' };
	assert.doesNotThrow(() => blogPrerenderGuard(0)(details));
	assert.throws(() => blogPrerenderGuard(1)(details), /경로 누락/);
	assert.throws(() => blogPrerenderGuard(0)({ ...details, routes: ['/team-maker'] }), /경로 누락/);
	assert.throws(
		() => blogPrerenderGuard(0)({ ...details, routes: ['/blog/[slug]', '/qr-code'] }),
		/경로 누락/
	);
});
const source = (changes = {}, body = '## 사용 방법\n\n본문입니다.') =>
	`---\n${stringify({ ...defaults, ...changes })}---\n${body}`;
const parse = (changes, body) => parsePost(source(changes, body), 'example.md', { now });

test('제목과 별개인 주소·목차·공개 정보를 유지한다', async () => {
	const post = await parse(
		{ title: '바뀐 제목' },
		'## 같은 제목\n\n본문\n\n## 같은 제목\n\n### 세부 내용'
	);
	assert.equal(post.slug, 'sample');
	assert.deepEqual(
		post.toc.map((item) => item.id),
		['section-1', 'section-2', 'section-3']
	);
	assert.ok(post.html.includes('id="section-2"'));
	assert.equal(summarizePost(post).body, undefined);
	assert.equal(summarizePost(post).file, undefined);
});

for (const [name, changes, message] of [
	['공개 여부 누락', { published: undefined }, /published/],
	['공개 여부 문자열', { published: 'false' }, /published/],
	['제목 누락', { title: '' }, /title/],
	['잘못된 주소', { slug: '../escape' }, /slug/],
	['없는 프로그램', { program: 'missing' }, /프로그램 ID/],
	['객체 기본 속성 프로그램', { program: 'toString' }, /프로그램 ID/],
	['없는 종류', { category: 'news' }, /글 종류/],
	['잘못된 날짜', { publishedAt: '2026-02-30' }, /존재하지 않는 날짜/],
	['역전된 수정일', { updatedAt: '2026-09-28' }, /게시일보다/],
	['미래 수정일', { updatedAt: '2026-09-30' }, /미래 수정일/],
	['없는 이미지', { image: '/images/missing.png', imageAlt: '예시' }, /이미지 파일/],
	['경로를 벗어난 이미지', { image: '/images/../favicon.svg', imageAlt: '예시' }, /로컬 경로/],
	['메타 정보 오타', { publshed: false }, /알 수 없는 글 정보/]
]) {
	test(`${name}: 파일명과 원인을 알린다`, async () => {
		await assert.rejects(
			parse(changes),
			(error) => error.message.includes('example.md:') && message.test(error.message)
		);
	});
}

test('예약은 한국 시간 자정부터 공개되고 초안은 날짜가 지나도 공개되지 않는다', async () => {
	for (const [time, expected] of [
		['2026-09-28T14:59:59.999Z', 'scheduled'],
		['2026-09-28T15:00:00.000Z', 'published'],
		['2026-10-01T00:00:00.000Z', 'published']
	]) {
		const post = await parsePost(source(), 'example.md', { now: new Date(time) });
		assert.equal(post.published, true, '원문의 승인 여부를 덮어쓰지 않는다.');
		assert.equal(post.publicationStatus, expected);
		assert.equal(isPublicPost(post), expected === 'published');
		const draft = await parsePost(source({ published: false }), 'draft.md', {
			now: new Date(time)
		});
		assert.equal(draft.publicationStatus, 'draft');
		assert.equal(isPublicPost(draft), false);
	}
	assert.equal(
		(await parse({ published: false, publishedAt: '2099-01-01' })).publicationStatus,
		'draft'
	);
});

test('예약 글은 경로·관련 글에서 제외되고 공개일부터 같은 본문과 날짜로 포함된다', async () => {
	const scheduledSource = source({ slug: 'next', publishedAt: '2026-09-30' });
	const scheduled = await parsePost(scheduledSource, 'next.md', { now });
	const current = await parse({ slug: 'current' });
	const posts = [current, scheduled];
	assert.deepEqual(publicEntries(posts), [{ slug: 'current' }]);
	assert.deepEqual(publicPaths(posts), ['/blog/current']);
	assert.deepEqual(relatedPosts(posts, current), []);
	assert.equal(summarizePost(scheduled).publicationStatus, 'scheduled');
	const released = await parsePost(scheduledSource, 'next.md', {
		now: new Date('2026-09-29T15:00:00Z')
	});
	assert.equal(released.html, scheduled.html);
	assert.equal(released.publishedAt, '2026-09-30');
	assert.deepEqual(publicEntries([current, released]), [{ slug: 'current' }, { slug: 'next' }]);
	assert.equal(relatedPosts([current, released], current)[0].slug, 'next');
});

test('중복 YAML·빈 본문·본문 h1을 거절한다', async () => {
	await assert.rejects(
		parsePost(source().replace('slug: sample', 'slug: sample\nslug: repeated'), 'duplicate.md'),
		/duplicate.md:.*글 정보 형식/s
	);
	await assert.rejects(parse({}, ''), /본문이 비어/);
	await assert.rejects(parse({}, '# 중복 페이지 제목'), /##부터/);
});

test('여러 예약일을 순서대로 공개하고 지나간 예약 취소는 계속 제외한다', async (t) => {
	const directory = await mkdtemp(path.join(os.tmpdir(), 'blog-schedule-'));
	t.after(() => rm(directory, { recursive: true, force: true }));
	for (const day of ['05', '07', '09']) {
		await writeFile(
			path.join(directory, `day-${day}.md`),
			source({ slug: `day-${day}`, publishedAt: `2026-10-${day}` })
		);
	}
	await writeFile(
		path.join(directory, 'cancelled.md'),
		source({ slug: 'cancelled', publishedAt: '2026-10-01', published: false })
	);
	for (const [date, expected] of [
		['2026-10-04T14:59:59Z', []],
		['2026-10-04T15:00:00Z', ['day-05']],
		['2026-10-06T15:00:00Z', ['day-07', 'day-05']],
		['2026-10-10T15:00:00Z', ['day-09', 'day-07', 'day-05']]
	]) {
		const posts = await readPosts({ directory, now: new Date(date) });
		assert.deepEqual(
			publicEntries(posts).map(({ slug }) => slug),
			expected
		);
	}
});

test('원시 HTML과 위험한 링크를 실행하지 않고 표·코드·일반 링크를 렌더링한다', async () => {
	const post = await parse(
		{},
		'<script>alert(1)</script>\n\n[위험](javascript:alert(1))\n\n[열기](/team-maker)\n\n| 이름 | 값 |\n| --- | --- |\n| 예시 | 1 |\n\n```js\nconst text = "<script>";\n```'
	);
	assert.ok(!post.html.includes('<script>'));
	assert.ok(!post.html.includes('href="javascript:'));
	assert.ok(post.html.includes('href="/team-maker"'));
	assert.ok(post.html.includes('role="region"'));
	assert.ok(post.html.includes('<table>'));
	assert.ok(post.html.includes('&lt;script&gt;'));
});

test('본문 로컬 이미지와 대체 텍스트를 검증한다', async () => {
	const post = await parse({}, '![사이트 소개](/images/site-open-graph-1200x630.png)');
	assert.ok(post.html.includes('loading="lazy"'));
	await assert.rejects(parse({}, '![](/images/site-open-graph-1200x630.png)'), /대체 텍스트/);
	await assert.rejects(parse({}, '![설명](/images/missing.png)'), /이미지 파일/);
});

test('단독 이미지의 설명을 안전한 캡션으로 표시하고 일반 이미지는 유지한다', async () => {
	const image = '/images/site-open-graph-1200x630.png';
	const post = await parse(
		{},
		`![화면 설명](${image} '예시 <script>alert(1)</script> & "설명"')\n\n![캡션 없음](${image})\n\n문장 안 ![작은 이미지](${image} "도움말")입니다.`
	);
	assert.equal((post.html.match(/<figure>/g) || []).length, 1);
	assert.ok(post.html.includes('alt="화면 설명" loading="lazy" decoding="async"'));
	assert.ok(
		post.html.includes(
			'<figcaption>예시 &lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;설명&quot;</figcaption></figure>'
		)
	);
	assert.ok(!post.html.includes('<script>'));
	assert.ok(post.html.includes(`<p><img src="${image}" alt="캡션 없음"`));
	assert.ok(post.html.includes(`문장 안 <img src="${image}" alt="작은 이미지" title="도움말"`));
});

test('빈 폴더·초안만 있는 폴더·공개 글 정렬·중복 slug를 검증한다', async (t) => {
	const directory = await mkdtemp(path.join(os.tmpdir(), 'blog-content-'));
	t.after(() => rm(directory, { recursive: true, force: true }));
	assert.deepEqual(await readPosts({ directory, now }), []);
	assert.deepEqual(await readPosts({ directory: path.join(directory, 'not-created'), now }), []);
	await writeFile(path.join(directory, 'draft.md'), source({ published: false, slug: 'draft' }));
	assert.deepEqual(publicEntries(await readPosts({ directory, now })), []);
	await writeFile(
		path.join(directory, 'old.md'),
		source({ slug: 'old', publishedAt: '2026-09-28' })
	);
	await writeFile(path.join(directory, 'new.md'), source({ slug: 'new' }));
	assert.deepEqual(publicEntries(await readPosts({ directory, now })), [
		{ slug: 'new' },
		{ slug: 'old' }
	]);
	await writeFile(path.join(directory, 'duplicate.md'), source({ slug: 'new' }));
	await assert.rejects(readPosts({ directory, now }), /중복 slug new/);
});

test('관련 글은 공개한 같은 프로그램 글만 사용하고 소개를 먼저 보여준다', async () => {
	const current = await parse({ slug: 'current', category: 'update' });
	const intro = await parse({ slug: 'intro', publishedAt: '2026-09-28' });
	const draft = await parse({ slug: 'draft', published: false });
	const other = await parse({ slug: 'other', program: 'qr-code' });
	assert.deepEqual(
		relatedPosts([current, draft, other, intro], current).map((post) => post.slug),
		['intro']
	);
});

test('프로그램 연결 없이 일반 기록을 작성하고 같은 종류의 글을 연결한다', async () => {
	const note = await parse({ slug: 'note', program: undefined, category: 'note' });
	const other = await parse({ slug: 'other-note', program: undefined, category: 'note' });
	const tool = await parse({ slug: 'tool' });
	assert.equal(note.program, undefined);
	assert.deepEqual(
		relatedPosts([note, other, tool], note).map((post) => post.slug),
		['other-note']
	);
	assert.ok(rss([note]).includes('/blog/note'));
});

test('RSS 특수문자·고정 식별자와 구조화 데이터의 날짜·기본 이미지를 보존한다', async () => {
	const post = await parse({
		title: 'A & B <새 글>',
		summary: '"소개" & 안내',
		updatedAt: '2026-09-29'
	});
	const xml = rss([post]);
	assert.ok(xml.includes('A &amp; B &lt;새 글&gt;'));
	assert.ok(xml.includes('&quot;소개&quot; &amp; 안내'));
	assert.ok(
		xml.includes('<guid isPermaLink="true">https://hjh3311504.github.io/blog/sample</guid>')
	);
	const schema = structuredPost(post);
	assert.equal(schema.headline, post.title);
	assert.equal(schema.datePublished, '2026-09-29T00:00:00+09:00');
	assert.equal(schema.dateModified, '2026-09-29T00:00:00+09:00');
	assert.equal(schema.image, postImage(post).url);
	assert.ok(schema.image.endsWith('/images/site-open-graph-1200x630.png'));
	assert.equal(structuredPost(await parse()).dateModified, undefined);
});

test('지정한 이미지의 실제 파일과 설명을 확인한다', async (t) => {
	const staticDir = await mkdtemp(path.join(os.tmpdir(), 'blog-images-'));
	t.after(() => rm(staticDir, { recursive: true, force: true }));
	await mkdir(path.join(staticDir, 'images'));
	await writeFile(path.join(staticDir, 'images/cover.svg'), '<svg/>');
	await parsePost(source({ image: '/images/cover.svg', imageAlt: '표지' }), 'image.md', {
		now,
		staticDir
	});
	await assert.rejects(
		parsePost(source({ image: '/images/cover.svg' }), 'image.md', { now, staticDir }),
		/imageAlt/
	);
});
