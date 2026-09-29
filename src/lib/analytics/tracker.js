export const CONSENT_KEY = 'juno.develog.analytics-consent:v1';
export const ANALYTICS_CONTEXT = 'site-analytics';

const pageTitles = new Map([
	['/', "Lake's develog"],
	['/team-maker', '팀 메이커'],
	['/qr-code', 'QR 코드 만들기'],
	['/marble-race', 'ASMR 구슬 레이스']
]);

export function isAnalyticsEnabled({ measurementId = '', origin = '', production, location }) {
	if (!production || !/^G-[A-Z0-9]+$/.test(measurementId)) return false;
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
		const value = window.localStorage.getItem(CONSENT_KEY);
		// 이전 버전의 허용 기록도 이제 쿠키 없는 측정만 사용한다.
		return value === 'denied' ? 'denied' : 'unknown';
	} catch {
		return 'unknown';
	}
}

function referrerOrigin(value) {
	try {
		const url = new URL(value);
		return ['http:', 'https:'].includes(url.protocol) ? `${url.origin}/` : '';
	} catch {
		return '';
	}
}

// 쿠키 없는 측정만 사용하며 이전 버전에서 저장한 거부 선택은 유지한다.
export function createAnalytics({ window, document, measurementId, origin, production, onChange }) {
	const enabled = isAnalyticsEnabled({
		measurementId,
		origin,
		production,
		location: window.location
	});
	let consent = readConsent(window);
	let current = null;
	let previous = null;
	let script;
	let loaded = false;
	let initialized = false;
	let failed = false;
	let destroyed = false;
	let pending = [];
	const disableKey = `ga-disable-${measurementId}`;

	function gtag() {
		window.dataLayer.push(arguments);
	}

	function publish() {
		onChange({ enabled: enabled && Boolean(current), consent });
	}

	function canSend() {
		return enabled && consent !== 'denied' && current && !failed && !destroyed;
	}

	function send(view) {
		// 자동 이벤트도 정제된 페이지 정보만 사용하도록 기본값을 함께 갱신한다.
		gtag('set', view);
		gtag('event', 'page_view', { ...view, send_to: measurementId });
	}

	function flush() {
		if (!loaded || !canSend()) return;
		if (!initialized) {
			gtag('config', measurementId, {
				send_page_view: false,
				allow_google_signals: false,
				allow_ad_personalization_signals: false,
				...pending[0]
			});
			initialized = true;
		}
		for (const view of pending) send(view);
		pending = [];
	}

	function track() {
		if (!canSend() || previous?.page_location === current.page_location) return;
		window[disableKey] = false;
		const view = {
			...current,
			page_referrer: previous?.page_location ?? referrerOrigin(document.referrer)
		};
		previous = view;
		// 로딩이 끝나지 않는 차단 환경에서도 대기열이 계속 늘어나지 않게 한다.
		pending = [...pending.slice(-49), view];
		if (!script) {
			window.dataLayer = window.dataLayer || [];
			// 태그가 실행되기 전에 동의 기본값을 전달한다.
			gtag('consent', 'default', {
				analytics_storage: 'denied',
				ad_storage: 'denied',
				ad_user_data: 'denied',
				ad_personalization: 'denied'
			});
			gtag('js', new Date());
			script = document.createElement('script');
			script.async = true;
			script.referrerPolicy = 'no-referrer';
			script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
			script.onload = () => {
				loaded = true;
				flush();
			};
			script.onerror = () => {
				failed = true;
				pending = [];
			};
			document.head.appendChild(script);
		}
		flush();
	}

	function clearCookies() {
		for (const name of ['_ga', `_ga_${measurementId.slice(2)}`]) {
			document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
		}
	}

	function applyConsent(value) {
		consent = value;
		if (enabled) {
			window[disableKey] = consent === 'denied' || !current;
			if (consent === 'denied') {
				pending = [];
				previous = null;
			}
			clearCookies();
		}
		publish();
		track();
	}

	function onStorage(event) {
		if (event.key === CONSENT_KEY || event.key === null) applyConsent(readConsent(window));
	}

	window.addEventListener('storage', onStorage);
	if (enabled) {
		window[disableKey] = true;
		// 이전 버전에서 허용해 생성한 분석 쿠키도 새 태그 실행 전에 삭제한다.
		clearCookies();
	}
	publish();

	return {
		navigate(url, status = 200) {
			const title = pageTitles.get(url.pathname);
			current =
				url.origin === origin && title && status < 400
					? { page_location: `${origin}${url.pathname}`, page_title: title }
					: null;
			publish();
			if (!current) {
				previous = null;
				pending = [];
				if (enabled) window[disableKey] = true;
				return;
			}
			track();
		},
		destroy() {
			destroyed = true;
			pending = [];
			if (enabled) window[disableKey] = true;
			window.removeEventListener('storage', onStorage);
			if (script) {
				script.onload = null;
				script.onerror = null;
				script.remove();
			}
		}
	};
}
