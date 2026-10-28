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
	// 광고·통계 등 외부 서비스에는 요청을 보내지 않는다.
	await page.route('**/*', (route) =>
		new URL(route.request().url()).hostname === 'hjh3311504.github.io'
			? route.continue()
			: route.abort()
	);
	const response = await page.goto(source, { waitUntil: 'networkidle' });
	if (!response?.ok()) throw new Error(`원문 응답 오류: ${response?.status()}`);
	await page.evaluate(() => document.fonts.ready);
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
