import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	BEACON_SRC,
	CONSENT_KEY,
	createAnalytics,
	isAnalyticsEnabled
} from '../../src/lib/analytics/tracker.js';

const origin = 'https://analytics.example';
const token = '00000000000000000000000000000000';

function fixture(options = {}) {
	const storage = new Map();
	if (options.consent) storage.set(CONSENT_KEY, options.consent);
	const listeners = new Map();
	const scripts = [];
	const cookies = [];
	let state;
	let reloads = 0;
	const location = new URL(origin);
	location.reload = () => reloads++;
	const window = {
		location,
		localStorage: { getItem: (key) => storage.get(key) },
		addEventListener: (event, fn) => listeners.set(event, fn),
		removeEventListener: (event) => listeners.delete(event)
	};
	const document = {
		createElement: () => ({
			attributes: {},
			setAttribute(name, value) {
				this.attributes[name] = value;
			},
			remove() {
				this.removed = true;
			}
		}),
		head: { appendChild: (script) => scripts.push(script) },
		get cookie() {
			return '_ga=legacy; _ga_OLD123=legacy; theme=dark';
		},
		set cookie(value) {
			cookies.push(value);
		}
	};
	const tracker = createAnalytics({
		window,
		document,
		token,
		origin,
		production: true,
		publicPaths: ['/blog/published-post'],
		...options,
		onChange: (value) => (state = value)
	});
	return {
		tracker,
		window,
		scripts,
		storage,
		listeners,
		cookies,
		state: () => state,
		reloads: () => reloads,
		changeStoredConsent(value) {
			if (value) storage.set(CONSENT_KEY, value);
			else storage.clear();
			listeners.get('storage')({ key: value ? CONSENT_KEY : null });
		},
		navigate: (path, status) => tracker.navigate(new URL(path, origin), status)
	};
}

test('사이트 토큰·HTTPS 운영 주소·production이 일치할 때만 활성화한다', () => {
	const valid = { token, origin, production: true, location: new URL(origin) };
	assert.equal(isAnalyticsEnabled(valid), true);
	for (const changed of [
		{ token: '' },
		{ token: 'G-OLD123' },
		{ token: '<script>' },
		{ origin: '' },
		{ origin: `${origin}/` },
		{ production: false },
		{ location: new URL('https://preview.example') },
		{ origin: 'http://localhost:4174', location: new URL('http://localhost:4174') },
		{ origin: 'https://localhost', location: new URL('https://localhost') }
	])
		assert.equal(isAnalyticsEnabled({ ...valid, ...changed }), false);
});

test('기존 거부·미설정·개발 환경에서는 외부 태그를 요청하지 않는다', () => {
	for (const options of [{ consent: 'denied' }, { token: '' }, { production: false }]) {
		const f = fixture(options);
		f.navigate('/');
		f.navigate('/blog');
		assert.equal(f.scripts.length, 0);
		assert.equal(f.window.dataLayer, undefined);
	}
});

test('신규·기존 허용 방문 모두 공식 SPA 태그를 한 번만 실행한다', () => {
	for (const consent of [undefined, 'allowed']) {
		const f = fixture({ consent });
		for (const path of [
			'/',
			'/team-maker?name=비밀#입력',
			'/qr-code',
			'/marble-race',
			'/blog',
			'/blog/published-post'
		])
			f.navigate(path);
		assert.equal(f.scripts.length, 1);
		const script = f.scripts[0];
		assert.equal(script.src, BEACON_SRC);
		assert.equal(script.type, 'module');
		assert.deepEqual(JSON.parse(script.attributes['data-cf-beacon']), { token, spa: true });
		assert.equal(f.state().status, 'loading');
		script.onload();
		assert.equal(f.state().status, 'active');
		assert.equal(f.window.dataLayer, undefined);
		assert.ok(!JSON.stringify(script).includes('비밀'));
	}
});

test('초안·예약 글·알 수 없는 경로·오류 화면은 태그를 시작하지 않는다', () => {
	const f = fixture();
	for (const path of ['/private', '/blog/draft', '/blog/future', '/404.html']) f.navigate(path);
	f.navigate('/team-maker', 500);
	assert.equal(f.scripts.length, 0);
	assert.equal(f.state().enabled, false);
	f.navigate('/blog/published-post');
	assert.equal(f.scripts.length, 1);
});

test('이미 태그가 실행된 문서에서 수집 제외 경로는 문서를 바꿔 이동한다', () => {
	const f = fixture();
	f.navigate('/');
	assert.equal(
		f.tracker.requiresDocumentNavigation(new URL('/blog/published-post', origin)),
		false
	);
	assert.equal(f.tracker.requiresDocumentNavigation(new URL('/blog/draft', origin)), true);
	assert.equal(f.tracker.requiresDocumentNavigation(new URL('https://other.example/')), true);
	f.navigate('/team-maker', 500);
	assert.equal(f.reloads(), 1);
});

test('수집 제외 화면에서 공개 경로로 들어갈 때도 새 문서를 연다', () => {
	for (const [path, status] of [
		['/404.html', 404],
		['/blog/draft', 404],
		['/team-maker', 500]
	]) {
		const f = fixture();
		f.navigate(path, status);
		assert.equal(f.tracker.requiresDocumentNavigation(new URL('/', origin)), true);
		assert.equal(
			f.tracker.requiresDocumentNavigation(new URL('/blog/published-post', origin)),
			true
		);
		assert.equal(f.tracker.requiresDocumentNavigation(new URL('/blog/draft', origin)), false);
	}
	for (const options of [{ consent: 'denied' }, { token: '' }, { production: false }]) {
		const f = fixture(options);
		f.navigate('/404.html', 404);
		assert.equal(f.tracker.requiresDocumentNavigation(new URL('/', origin)), false);
	}
});

test('다른 탭의 기존 거부 변경은 문서를 다시 열어 실행 중인 태그도 종료한다', () => {
	const f = fixture();
	f.navigate('/');
	f.changeStoredConsent('denied');
	assert.equal(f.state().consent, 'denied');
	assert.equal(f.reloads(), 1);
	f.changeStoredConsent('denied');
	assert.equal(f.reloads(), 1);
	f.changeStoredConsent(null);
	assert.equal(f.reloads(), 2);
});

test('실패 상태를 알리고 반복 이동과 종료 이후에 태그를 다시 만들지 않는다', () => {
	const f = fixture();
	f.navigate('/');
	f.scripts[0].onerror();
	assert.equal(f.state().status, 'blocked');
	f.navigate('/blog');
	assert.equal(f.scripts.length, 1);
	f.tracker.destroy();
	assert.equal(f.listeners.size, 0);
	assert.equal(f.scripts[0].onload, null);
	assert.equal(f.scripts[0].removed, true);
	f.navigate('/');
	assert.equal(f.scripts.length, 1);
});

test('이전 GA 쿠키만 삭제하고 도구 설정과 기존 거부 선택은 보존한다', () => {
	const f = fixture({ consent: 'denied' });
	assert.equal(f.cookies.length, 4);
	assert.ok(f.cookies.every((value) => value.startsWith('_ga') && value.includes('Max-Age=0')));
	assert.equal(f.storage.get(CONSENT_KEY), 'denied');
});

test('저장 공간을 읽을 수 없어도 동의 버튼 없이 시작한다', () => {
	const f = fixture();
	f.window.localStorage.getItem = () => {
		throw new Error('저장 차단');
	};
	f.changeStoredConsent(null);
	assert.doesNotThrow(() => f.navigate('/'));
	assert.equal(f.scripts.length, 1);
});
