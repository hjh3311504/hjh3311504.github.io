export const CONSENT_KEY = 'juno.develog.analytics-consent:v1';
export const ANALYTICS_CONTEXT = 'site-analytics';
export const BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';

export const basePaths = ['/', '/team-maker', '/qr-code', '/marble-race', '/blog'];

export function isAnalyticsEnabled({ token = '', origin = '', production, location }) {
	if (!production || !/^[a-f0-9]{32}$/i.test(token)) return false;
	try {
		const url = new URL(origin);
		return (
			url.protocol === 'https:' &&
			url.origin === origin &&
			location.origin === origin &&
			!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
		);
	} catch {
		return false;
	}
}

function readConsent(window) {
	try {
		return window.localStorage.getItem(CONSENT_KEY) === 'denied' ? 'denied' : 'unknown';
	} catch {
		return 'unknown';
	}
}

// 공식 beacon이 첫 조회와 SPA 이동을 측정한다. 별도의 조회 요청을 만들지 않는다.
export function createAnalytics({
	window,
	document,
	token,
	origin,
	production,
	publicPaths = [],
	onChange
}) {
	const configured = isAnalyticsEnabled({ token, origin, production, location: window.location });
	const paths = new Set([...basePaths, ...publicPaths]);
	let consent = readConsent(window);
	let eligible = false;
	let script;
	let status = 'idle';
	let destroyed = false;

	function isPublic(url) {
		return url.origin === origin && paths.has(url.pathname);
	}

	function publish() {
		onChange({ enabled: configured && eligible, consent, status });
	}

	function onStorage(event) {
		if (event.key !== CONSENT_KEY && event.key !== null) return;
		const next = readConsent(window);
		if (next === consent) return;
		consent = next;
		publish();
		// 공식 beacon에는 종료 API가 없다. 문서를 새로 열어 이전 태그도 종료한다.
		if (configured) window.location.reload();
	}

	window.addEventListener('storage', onStorage);
	if (configured) {
		// 이전 GA4 쿠키만 정리한다. 도구 데이터와 기존 거부 선택은 보존한다.
		for (const cookie of document.cookie.split(';')) {
			const name = cookie.split('=')[0].trim();
			if (!/^_ga(?:_[A-Z0-9]+)?$/.test(name)) continue;
			const expired = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
			document.cookie = expired;
			document.cookie = `${expired}; Domain=${window.location.hostname}`;
		}
	}
	publish();

	return {
		// 양방향으로 문서를 나눈다. 같은 문서의 뒤로 가기는 beforeNavigate보다
		// beacon이 먼저 감지하므로, 제외 경로에서 태그를 시작해서도 안 된다.
		requiresDocumentNavigation(url) {
			return configured && consent !== 'denied' && eligible !== isPublic(url);
		},
		navigate(url, pageStatus = 200) {
			if (destroyed) return;
			eligible = isPublic(url) && pageStatus < 400;
			publish();
			if (!configured || consent === 'denied') return;
			if (!eligible) {
				if (script) window.location.reload();
				return;
			}
			if (script) return;
			status = 'loading';
			script = document.createElement('script');
			script.type = 'module';
			script.src = BEACON_SRC;
			script.referrerPolicy = 'strict-origin';
			script.setAttribute('data-cf-beacon', JSON.stringify({ token, spa: true }));
			script.onload = () => {
				status = 'active';
				publish();
			};
			script.onerror = () => {
				status = 'blocked';
				publish();
			};
			document.head.appendChild(script);
			publish();
		},
		destroy() {
			destroyed = true;
			window.removeEventListener('storage', onStorage);
			if (script) {
				script.onload = null;
				script.onerror = null;
				script.remove();
			}
		}
	};
}
