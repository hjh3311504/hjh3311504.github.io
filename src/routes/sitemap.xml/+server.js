import { filteredPosts } from '$lib/data/blog-posts';
import { siteBaseUrl } from '$lib/data/meta';

export const prerender = true;

export function GET() {
	const staticPages = ['/', '/blog', '/team-maker/'].map((pathname) => ({ pathname }));
	const blogPages = filteredPosts.map((post) => ({
		pathname: `/blog/${post.slug}`,
		lastModified: post.updated ?? post.date
	}));

	const body = sitemap([...staticPages, ...blogPages]);

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8'
		}
	});
}

/**
 * @param {{ pathname: string; lastModified?: string | Date }[]} pages
 */
function sitemap(pages) {
	const baseUrl = siteBaseUrl.replace(/\/+$/, '');
	const urls = pages
		.map(({ pathname, lastModified }) => {
			const location = escapeXml(new URL(pathname, `${baseUrl}/`).href);
			const lastmod = lastModified
				? `\n    <lastmod>${new Date(lastModified).toISOString().slice(0, 10)}</lastmod>`
				: '';

			return `  <url>\n    <loc>${location}</loc>${lastmod}\n  </url>`;
		})
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** @param {string} value */
function escapeXml(value) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}
