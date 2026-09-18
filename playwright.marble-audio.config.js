import { defineConfig } from '@playwright/test';
export default defineConfig({
	testDir: './tests/marble-audio-e2e',
	timeout: 90000,
	workers: 1,
	reporter: [['list'], ['json', { outputFile: 'output/marble-audio-tests/results.json' }]],
	outputDir: 'output/marble-audio-tests',
	use: { viewport: { width: 1440, height: 1000 }, locale: 'ko-KR' },
	projects: [
		{ name: 'chromium', use: { browserName: 'chromium' } },
		{ name: 'webkit', use: { browserName: 'webkit' } }
	],
	webServer: [
		{
			command: 'npm run preview -- --host 127.0.0.1 --port 4179',
			url: 'http://127.0.0.1:4179',
			reuseExistingServer: false
		},
		{
			command: 'npm run dev -- --host 127.0.0.1 --port 5181',
			url: 'http://127.0.0.1:5181',
			reuseExistingServer: false
		}
	]
});
