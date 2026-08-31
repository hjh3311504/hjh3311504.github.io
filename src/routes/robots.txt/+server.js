import { siteBaseUrl } from '$lib/data/meta';

export const prerender = true;

export function GET() {
	const baseUrl = siteBaseUrl.replace(/\/+$/, '');
	const body = `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8'
		}
	});
}
