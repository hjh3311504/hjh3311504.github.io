// 실행: node scripts/capture_blog_qr_title.js [로컬 개발 서버 주소]
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { create } from 'fontkit';

const base = process.argv[2] || 'http://127.0.0.1:5173';
const directory = 'static/downloads/blog/qr-title';
const images = 'static/images/blog/qr-title';
await mkdir(directory, { recursive: true });
await mkdir(images, { recursive: true });
const browser = await chromium.launch();
try {
	const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
	await page.route('**/*', (route) =>
		new URL(route.request().url()).origin === new URL(base).origin
			? route.continue()
			: route.abort()
	);
	const response = await page.goto(`${base}/qr-code`, { waitUntil: 'networkidle' });
	if (!response?.ok()) throw new Error(`도구 응답 오류: ${response?.status()}`);
	await page.getByLabel(/^웹페이지 주소/).fill('https://hjh3311504.github.io/blog');
	await page.getByLabel('제목', { exact: true }).fill('모임🎉');
	const notice = page.getByText('SVG 제목으로 저장할 수 없는 글자:', { exact: false });
	await expect(notice).toBeVisible({ timeout: 20000 });
	await expect(page.getByRole('button', { name: 'SVG 저장', exact: true })).toBeDisabled();
	await expect(page.getByRole('button', { name: 'PNG 저장', exact: true })).toBeEnabled();
	await page.locator('.qr-preview-panel').screenshot({ path: `${images}/svg-notice.png` });
	const pngEvent = page.waitForEvent('download');
	await page.getByRole('button', { name: 'PNG 저장', exact: true }).click();
	await (await pngEvent).saveAs(`${directory}/emoji-title.png`);
	const { data, info } = await sharp(`${directory}/emoji-title.png`)
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data;
	if (decoded !== 'https://hjh3311504.github.io/blog') throw new Error('PNG 주소 확인 실패');
	const error = await notice.innerText();
	await page.getByLabel('제목', { exact: true }).fill('모임 안내');
	await expect(page.getByRole('button', { name: 'SVG 저장', exact: true })).toBeEnabled();
	const svgEvent = page.waitForEvent('download');
	await page.getByRole('button', { name: 'SVG 저장', exact: true }).click();
	await (await svgEvent).saveAs(`${directory}/plain-title.svg`);
	const svg = await readFile(`${directory}/plain-title.svg`, 'utf8');
	if (svg.includes('<text') || !svg.includes('id="qr-title"'))
		throw new Error('SVG 구조 확인 실패');
	const font = create(await readFile('.svelte-kit/qr-font/SUIT-Variable.ttf'));
	const titleFontSupports = Object.fromEntries(
		['é', '漢', '\u3000', '★', '♥'].map((character) => [
			character,
			font.hasGlyphForCodePoint(character.codePointAt(0))
		])
	);
	await writeFile(
		`${directory}/verification.json`,
		JSON.stringify(
			{
				checkedAt: new Date().toISOString(),
				browser: await browser.version(),
				platform: process.platform,
				content: decoded,
				emojiTitle: '모임🎉',
				notice: error,
				png: { width: info.width, height: info.height, decoded },
				svgTitle: '모임 안내',
				svgUsesTextElement: svg.includes('<text'),
				svgUsesExternalFont: /<(?:image|style)|@font-face|href=/u.test(svg),
				titleFontSupports,
				physicalScanTested: false
			},
			null,
			2
		) + '\n'
	);
} finally {
	await browser.close();
}
