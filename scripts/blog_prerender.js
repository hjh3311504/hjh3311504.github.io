/** 글0개는 정상 상태다. 공개 글이 있거나 다른 경로가 빠졌다면 build를 중단한다. */
export function blogPrerenderGuard(publicEntryCount) {
	return ({ routes, message }) => {
		if (publicEntryCount !== 0 || routes.some((route) => route !== '/blog/[slug]')) {
			throw new Error(message);
		}
	};
}
