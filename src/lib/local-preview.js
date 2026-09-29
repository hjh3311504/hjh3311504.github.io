const localColor = '#d15a16';
const localIcon = `data:image/svg+xml,${encodeURIComponent(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${localColor}"/><path d="M19 15h10v32h19v9H19z" fill="#fff" transform="translate(0 -3)"/></svg>`
)}`;

// 개발 서버와 로컬 정적 preview를 탭에서 구분한다. 배포 사이트에는 적용하지 않는다.
export function markLocalPreview({ window, document, dev }) {
	const hostname = window.location.hostname;
	const local =
		dev ||
		hostname === 'localhost' ||
		hostname.endsWith('.localhost') ||
		hostname === '[::1]' ||
		/^127(?:\.\d{1,3}){3}$/.test(hostname);
	if (!local) return;

	function update() {
		if (!document.title.startsWith('[로컬] ')) document.title = `[로컬] ${document.title}`;
		for (const icon of document.head.querySelectorAll('link[rel~="icon"]')) {
			if (icon.getAttribute('href') !== localIcon) icon.setAttribute('href', localIcon);
			if (icon.type !== 'image/svg+xml') icon.type = 'image/svg+xml';
			if (icon.getAttribute('sizes') !== 'any') icon.setAttribute('sizes', 'any');
		}
		for (const meta of document.head.querySelectorAll('meta[name="theme-color"]')) {
			if (meta.content !== localColor) meta.content = localColor;
		}
	}

	update();
	// 페이지 이동 시 Svelte가 제목과 도구 전용 favicon을 바꿔도 표시를 유지한다.
	const observer = new window.MutationObserver(update);
	observer.observe(document.head, {
		childList: true,
		subtree: true,
		characterData: true,
		attributes: true,
		attributeFilter: ['href', 'rel', 'type', 'sizes', 'content', 'name']
	});
	return () => observer.disconnect();
}
