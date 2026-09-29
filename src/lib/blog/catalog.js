import { siteBaseUrl, image } from '../data/meta.js';

export const blogTitle = '블로그';
export const blogDescription = '경험과 생각, 일상의 이야기를 기록합니다.';
export const author = { name: 'Lake', url: 'https://github.com/hjh3311504' };
export const programs = {
	'team-maker': { name: '팀 메이커', href: '/team-maker' },
	'qr-code': { name: 'QR 코드 만들기', href: '/qr-code' },
	'marble-race': { name: 'ASMR 구슬 레이스', href: '/marble-race' }
};
export const categories = {
	introduction: '프로그램 소개',
	guide: '사용 가이드',
	update: '업데이트',
	note: '기록'
};
export const postPath = (slug) => `/blog/${slug}`;
export const absoluteUrl = (pathname) => new URL(pathname, `${siteBaseUrl}/`).href;
export const dateTime = (date) => `${date}T00:00:00+09:00`;
export const formatDate = (date) => date.replaceAll('-', '. ');

export function postImage(post) {
	return {
		url: post.image ? absoluteUrl(post.image) : image,
		alt: post.imageAlt || 'Lake의 개발 도구와 프로젝트를 소개하는 사이트'
	};
}

export function structuredPost(post) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: post.title,
		description: post.summary,
		url: absoluteUrl(postPath(post.slug)),
		mainEntityOfPage: absoluteUrl(postPath(post.slug)),
		inLanguage: 'ko-KR',
		author: { '@type': 'Person', ...author },
		datePublished: dateTime(post.publishedAt),
		...(post.updatedAt ? { dateModified: dateTime(post.updatedAt) } : {}),
		image: postImage(post).url
	};
}

export function xmlEscape(value) {
	return String(value).replace(
		/[&<>"']/g,
		(character) =>
			({
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&apos;'
			})[character]
	);
}

export function rss(posts) {
	const items = posts
		.map((post) => {
			const url = xmlEscape(absoluteUrl(postPath(post.slug)));
			return `<item><title>${xmlEscape(post.title)}</title><description>${xmlEscape(post.summary)}</description><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${new Date(dateTime(post.publishedAt)).toUTCString()}</pubDate></item>`;
		})
		.join('\n');
	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>${xmlEscape(blogTitle)} | Lake's develog</title><link>${absoluteUrl('/blog')}</link>
<description>${xmlEscape(blogDescription)}</description><language>ko-KR</language>
<atom:link href="${absoluteUrl('/rss.xml')}" rel="self" type="application/rss+xml"/>
${items}</channel></rss>`;
}
