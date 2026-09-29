import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	CONSENT_KEY,
	createAnalytics,
	isAnalyticsEnabled
} from '../../src/lib/analytics/tracker.js';

const origin = 'https://analytics.example';
const measurementId = 'G-TEST000001';

function fixture(options = {}) {
	const storage = new Map();
	if (options.consent) storage.set(CONSENT_KEY, options.consent);
	const listeners = new Map();
	const scripts = [];
	const cookies = [];
	let state;
	const window = {
		location: new URL(origin),
		localStorage: {
			getItem: (key) => storage.get(key),
			setItem: (key, value) => storage.set(key, value)
		},
		addEventListener: (event, fn) => listeners.set(event, fn),
		removeEventListener: (event) => listeners.delete(event)
	};
	const document = {
		referrer: 'https://search.example/private-name?q=secret#private',
		createElement: () => ({ remove() {} }),
		head: { appendChild: (script) => scripts.push(script) },
		set cookie(value) {
			cookies.push(value);
		}
	};
	const tracker = createAnalytics({
		window,
		document,
		measurementId,
		origin,
		production: true,
		...options,
		onChange: (value) => (state = value)
	});
	return {
		tracker,
		changeStoredConsent(value) {
			if (value) storage.set(CONSENT_KEY, value);
			else storage.clear();
			listeners.get('storage')({ key: value ? CONSENT_KEY : null });
		},
		window,
		scripts,
		storage,
		listeners,
		cookies,
		state: () => state,
		commands: () => (window.dataLayer ?? []).map((args) => Array.from(args)),
		views: () =>
			(window.dataLayer ?? []).filter((args) => args[0] === 'event').map((args) => args[2]),
		navigate: (path, status) => tracker.navigate(new URL(path, origin), status)
	};
}

test('ID·HTTPS 운영 주소·production이 모두 일치할 때만 수집한다', () => {
	const valid = { measurementId, origin, production: true, location: new URL(origin) };
	assert.equal(isAnalyticsEnabled(valid), true);
	for (const changed of [
		{ measurementId: '' },
		{ measurementId: 'G-<script>' },
		{ origin: '' },
		{ origin: `${origin}/` },
		{ production: false },
		{ location: new URL('https://preview.example') },
		{ origin: 'http://localhost:4174', location: new URL('http://localhost:4174') },
		{ origin: 'https://localhost', location: new URL('https://localhost') }
	])
		assert.equal(isAnalyticsEnabled({ ...valid, ...changed }), false);
});

test('거부·미설정·개발 환경에서는 Google 스크립트도 요청하지 않는다', () => {
	for (const options of [
		{ consent: 'denied' },
		{ consent: 'allowed', measurementId: '' },
		{ consent: 'allowed', production: false }
	]) {
		const f = fixture(options);
		f.navigate('/');
		f.navigate('/team-maker');
		assert.equal(f.scripts.length, 0);
		assert.equal(f.window.dataLayer, undefined);
	}
});

test('쿠키 없이 조회를 집계하며 URL·제목·유입 정보에서 입력을 제외한다', () => {
	const f = fixture();
	f.navigate('/team-maker?name=비밀#참가자');
	assert.equal(f.scripts.length, 1);
	assert.equal(f.scripts[0].referrerPolicy, 'no-referrer');
	f.scripts[0].onload();
	assert.deepEqual(f.views(), [
		{
			page_location: `${origin}/team-maker`,
			page_title: '팀 메이커',
			page_referrer: 'https://search.example/',
			send_to: measurementId
		}
	]);
	const config = f.commands().find(([command]) => command === 'config')[2];
	assert.equal(config.send_page_view, false);
	assert.equal(config.allow_google_signals, false);
	assert.equal(config.allow_ad_personalization_signals, false);
	assert.equal(JSON.stringify(f.commands()).includes('비밀'), false);
});

test('늦은 스크립트 로딩·반복 콜백·query·hash 이동은 중복 집계하지 않는다', () => {
	const f = fixture({ consent: 'allowed' });
	f.navigate('/');
	f.navigate('/');
	f.navigate('/?text=secret#name');
	f.navigate('/qr-code');
	f.scripts[0].onload();
	f.navigate('/qr-code#secret');
	f.navigate('/');
	f.navigate('/qr-code');
	assert.equal(f.scripts.length, 1);
	assert.deepEqual(
		f.views().map((view) => view.page_location),
		['/', '/qr-code', '/', '/qr-code'].map((path) => origin + path)
	);
	assert.equal(f.views()[1].page_referrer, `${origin}/`);
	assert.equal(f.commands().filter(([command]) => command === 'config').length, 1);
});

test('이전 버전의 탭에서 거부하면 로딩 중 대기열과 이후 전송을 차단한다', () => {
	const f = fixture({ consent: 'allowed' });
	f.navigate('/');
	f.navigate('/qr-code');
	f.changeStoredConsent('denied');
	f.scripts[0].onload();
	f.navigate('/team-maker');
	assert.deepEqual(f.views(), []);
	assert.equal(f.window[`ga-disable-${measurementId}`], true);
	assert.equal(f.storage.get(CONSENT_KEY), 'denied');
});

test('다른 탭의 거부·사이트 데이터 삭제를 반영하며 재개해도 쿠키를 허용하지 않는다', () => {
	const f = fixture();
	f.navigate('/');
	f.scripts[0].onload();
	f.changeStoredConsent('denied');
	f.navigate('/team-maker');
	assert.equal(f.views().length, 1);
	assert.equal(f.state().consent, 'denied');
	f.changeStoredConsent(null);
	assert.equal(f.state().consent, 'unknown');
	assert.equal(f.window[`ga-disable-${measurementId}`], false);
	assert.equal(f.views().length, 2);
	assert.ok(!JSON.stringify(f.commands()).includes('granted'));
});

test('오류 화면과 임의 경로는 집계하지 않으며 정상 페이지 재진입은 집계한다', () => {
	const f = fixture({ consent: 'allowed' });
	f.navigate('/');
	f.scripts[0].onload();
	f.navigate('/private-name');
	assert.equal(f.state().enabled, false);
	assert.equal(f.window[`ga-disable-${measurementId}`], true);
	f.navigate('/team-maker', 500);
	f.navigate('/');
	assert.equal(f.views().length, 2);
	assert.equal(JSON.stringify(f.commands()).includes('private-name'), false);
});

test('차단·종료 후에도 사이트 동작을 방해하지 않는다', () => {
	const f = fixture();
	f.navigate('/');
	f.scripts[0].onerror();
	for (let i = 0; i < 100; i++) f.navigate(i % 2 ? '/' : '/qr-code');
	assert.deepEqual(f.views(), []);
	assert.equal(f.scripts.length, 1);
	f.tracker.destroy();
	assert.equal(f.listeners.size, 0);
	assert.equal(f.scripts[0].onload, null);
	assert.equal(f.window[`ga-disable-${measurementId}`], true);
});

for (const consent of [undefined, 'allowed']) {
	test(`${consent ?? '신규'} 방문은 태그 실행 전 쿠키 저장을 거부하고 기존 쿠키를 지운다`, () => {
		const f = fixture({ consent });
		assert.equal(f.cookies.length, 2);
		assert.ok(f.cookies.every((value) => value.includes('Max-Age=0')));
		f.navigate('/');
		assert.deepEqual(f.commands()[0], [
			'consent',
			'default',
			{
				analytics_storage: 'denied',
				ad_storage: 'denied',
				ad_user_data: 'denied',
				ad_personalization: 'denied'
			}
		]);
		f.scripts[0].onload();
		f.changeStoredConsent('allowed');
		assert.equal(f.views().length, 1);
		f.navigate('/qr-code');
		assert.equal(f.views().length, 2);
		assert.ok(!JSON.stringify(f.commands()).includes('granted'));
	});
}

test('저장 공간을 읽을 수 없어도 쿠키 없는 측정으로 시작한다', () => {
	const listeners = new Map();
	const f = fixture({
		window: {
			location: new URL(origin),
			localStorage: {
				getItem() {
					throw new Error('저장 차단');
				}
			},
			addEventListener: (name, fn) => listeners.set(name, fn),
			removeEventListener: (name) => listeners.delete(name)
		}
	});
	assert.doesNotThrow(() => f.navigate('/'));
	assert.equal(f.scripts.length, 1);
});
