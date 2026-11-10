// 공개 글 한 편을 인쇄용 PDF로 보관하는 재현용 스크립트.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const source = 'https://hjh3311504.github.io/blog/bracket-result-correction';
const output = 'output/pdf';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
	const context = await browser.newContext({
		viewport: { width: 1440, height: 1000 },
		colorScheme: 'light'
	});
	const page = await context.newPage();
	// 광고·통계 등 외부 서비스에는 요청을 보내지 않는다. 원문 주소는 setalab.kr로 301 이동한다.
	const siteHosts = new Set(['hjh3311504.github.io', 'setalab.kr']);
	await page.route('**/*', (route) =>
		siteHosts.has(new URL(route.request().url()).hostname) ? route.continue() : route.abort()
	);
	const response = await page.goto(source, { waitUntil: 'networkidle' });
	if (!response?.ok()) throw new Error(`원문 응답 오류: ${response?.status()}`);
	await page.evaluate(() => document.fonts.ready);
	// 허용 주소가 빠지면 그림·글꼴 없이 PDF가 만들어지므로 출력 전에 확인한다.
	const missing = await page.evaluate(() => [
		...[...document.images].filter((img) => !img.naturalWidth).map((img) => img.src),
		...[...document.fonts].filter((font) => font.status === 'error').map((font) => font.family)
	]);
	if (missing.length) throw new Error(`불러오지 못한 그림·글꼴: ${missing.join(', ')}`);
	const options = {
		format: 'A4',
		margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' },
		scale: 1,
		displayHeaderFooter: false,
		printBackground: false
	};
	const pdf = await page.pdf({ ...options, path: `${output}/bracket-webpage.pdf` });
	await writeFile(
		`${output}/export-settings.json`,
		JSON.stringify(
			{
				checkedAt: new Date().toISOString(),
				source,
				browser: browser.version(),
				platform: process.platform,
				arch: process.arch,
				options,
				bytes: pdf.length,
				sha256: createHash('sha256').update(pdf).digest('hex'),
				method: 'Playwright page.pdf; print CSS; no DOM/style edits; third-party requests blocked'
			},
			null,
			2
		) + '\n'
	);
	console.log(`${output}/bracket-webpage.pdf에 저장했습니다`);
} finally {
	await browser.close();
}
