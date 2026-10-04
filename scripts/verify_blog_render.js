// 실제 production 렌더러로 공개·초안·빈 목록을 검사한다. 저장소 글과 build는 수정하지 않는다.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { stringify } from 'yaml';
import { Server } from '../.svelte-kit/output/server/index.js';
import { manifest } from '../.svelte-kit/output/server/manifest-full.js';
import { entries } from '../.svelte-kit/output/server/entries/pages/blog/_slug_/_page.server.js';
import { verifyBlogBuild } from './verify_blog_build.js';

const root = process.cwd();
const fixture = await mkdtemp(path.join(os.tmpdir(), 'blog-production-'));
const directory = path.join(fixture, 'content/blog');
const publicPost = {
	slug: 'public-check',
	title: '공개 렌더링 & <검증>',
	summary: '공개 글 설명',
	program: 'team-maker',
	category: 'introduction',
	publishedAt: '2020-01-01',
	published: true
};
const draft = {
	...publicPost,
	slug: 'draft-check',
	title: '비공개-검증-제목',
	summary: '비공개-검증-요약',
	published: false
};
const scheduled = {
	...publicPost,
	slug: 'scheduled-check',
	title: '예약-검증-제목',
	summary: '예약-검증-요약',
	publishedAt: '2099-12-31'
};

try {
	await mkdir(directory, { recursive: true });
	await mkdir(path.join(fixture, 'build/blog'), { recursive: true });
	await writeFile(
		path.join(directory, 'published.md'),
		`---\n${stringify(publicPost)}---\n## 본문 확인\n\n공개 본문 & 표기입니다.\n`
	);
	await writeFile(
		path.join(directory, 'draft.md'),
		`---\n${stringify(draft)}---\n비공개-검증-본문\n`
	);
	await writeFile(
		path.join(directory, 'scheduled.md'),
		`---\n${stringify(scheduled)}---\n예약-검증-본문\n`
	);
	process.chdir(fixture);
	const server = new Server(manifest);
	await server.init({ env: {} });
	const respond = (pathname) =>
		server.respond(new Request(`https://hjh3311504.github.io${pathname}`), {
			getClientAddress: () => '127.0.0.1'
		});
	assert.deepEqual(await entries(), [{ slug: publicPost.slug }]);
	for (const [url, file] of [
		['/blog', 'blog.html'],
		['/blog/public-check', 'blog/public-check.html'],
		['/rss.xml', 'rss.xml'],
		['/sitemap.xml', 'sitemap.xml']
	]) {
		const response = await respond(url);
		assert.equal(response.status, 200, `${url}: production 응답 실패`);
		await writeFile(path.join(fixture, 'build', file), await response.text());
	}
	await verifyBlogBuild({ root: fixture });
	for (const url of ['/blog/draft-check', '/blog/scheduled-check', '/blog/not-found']) {
		assert.equal((await respond(url)).status, 404, `${url}: 공개되지 않은 글 접근 가능`);
	}
	// SvelteKit의 데이터 응답은 HTTP 200 안에 route 오류 상태를 전달한다.
	for (const hidden of [draft, scheduled]) {
		const response = await respond(`/blog/${hidden.slug}/__data.json`);
		const payload = await response.text();
		const data = JSON.parse(payload);
		assert.ok(data.nodes.some((node) => node?.type === 'error' && node.status === 404));
		assert.ok(!payload.includes(hidden.title) && !payload.includes(hidden.summary));
	}
	const dataResponse = await respond('/blog/__data.json');
	assert.equal(dataResponse.status, 200);
	const listingData = await dataResponse.text();
	for (const hidden of [draft, scheduled]) {
		assert.ok(!listingData.includes(hidden.slug), '초안·예약이 클라이언트 데이터에 포함됐습니다.');
		assert.ok(
			!(await (await respond('/')).text()).includes(hidden.title),
			'홈에 초안·예약이 포함됐습니다.'
		);
		assert.ok(
			!(await (await respond('/blog/public-check')).text()).includes(hidden.title),
			'관련 글에 초안·예약이 포함됐습니다.'
		);
	}
	// 같은 예약 원문의 날짜만 공개 가능한 날로 바꿔 다음 build의 공개 동작을 재현한다.
	await writeFile(
		path.join(directory, 'scheduled.md'),
		`---\n${stringify({ ...scheduled, publishedAt: '2020-01-02' })}---\n예약-검증-본문\n`
	);
	assert.ok((await entries()).some((entry) => entry.slug === scheduled.slug));
	for (const url of ['/', '/blog', '/rss.xml', '/sitemap.xml', '/blog/public-check']) {
		assert.ok(
			(await (await respond(url)).text()).includes(scheduled.slug),
			`${url}: 공개일 도달 글 누락`
		);
	}
	const releasedResponse = await respond('/blog/scheduled-check');
	assert.equal(releasedResponse.status, 200);
	const releasedHtml = await releasedResponse.text();
	assert.ok(releasedHtml.includes('예약-검증-본문'));
	assert.ok(releasedHtml.includes('2020-01-02T00:00:00+09:00'));
	await rm(path.join(directory, 'scheduled.md'));
	for (const route of ['/team-maker', '/qr-code', '/marble-race']) {
		const response = await respond(route);
		assert.equal(response.status, 200, `${route}: production 응답 실패`);
		const tool = await response.text();
		assert.ok(!tool.includes('program-posts'), `${route}: 삭제한 블로그 섹션이 표시됩니다.`);
		assert.ok(!tool.includes('/blog/public-check'), `${route}: 관련 글 링크가 표시됩니다.`);
		assert.ok(!tool.includes(draft.title), `${route}: 초안이 표시됩니다.`);
	}
	const note = { ...publicPost, slug: 'general-note', title: '일상의 기록', category: 'note' };
	delete note.program;
	await writeFile(
		path.join(directory, 'note.md'),
		`---\n${stringify(note)}---\n프로그램과 관계없는 기록입니다.\n`
	);
	const noteResponse = await respond('/blog/general-note');
	assert.equal(noteResponse.status, 200);
	const noteHtml = await noteResponse.text();
	assert.ok(noteHtml.includes('프로그램과 관계없는 기록입니다.'));
	assert.ok(!noteHtml.includes('팀 메이커 체험하기'));
	assert.ok(noteHtml.includes('RSS 구독'));
	await rm(path.join(directory, 'note.md'));
	await rm(path.join(directory, 'published.md'));
	assert.deepEqual(await entries(), []);
	const draftOnly = await (await respond('/blog')).text();
	assert.ok(draftOnly.includes('첫 이야기를 준비하고 있어요'));
	assert.ok(!draftOnly.includes(draft.title));
	await rm(path.join(directory, 'draft.md'));
	assert.deepEqual(await entries(), []);
	assert.ok((await (await respond('/blog')).text()).includes('첫 이야기를 준비하고 있어요'));
	// 검사 중 실제 배포 파일이 바뀌지 않았는지 읽기까지 확인한다.
	assert.ok((await readFile(path.join(root, 'build/blog.html'), 'utf8')).includes('블로그'));
	console.log(
		'production 블로그 검사 통과: 공개 본문·entries·RSS·sitemap·초안/예약404·예약 해제·빈 목록·도구 블로그 섹션 제거'
	);
} finally {
	process.chdir(root);
	await rm(fixture, { recursive: true, force: true });
}
