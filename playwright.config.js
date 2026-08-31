import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests/team-maker-e2e',
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	timeout: 30_000,
	expect: {
		timeout: 5_000
	},
	reporter: [
		['list'],
		['html', { outputFolder: 'output/playwright/report', open: 'never' }]
	],
	outputDir: 'output/playwright/test-results',
	use: {
		baseURL: 'http://127.0.0.1:4174',
		locale: 'ko-KR',
		timezoneId: 'Asia/Seoul',
		reducedMotion: 'reduce',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure'
	},
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				viewport: { width: 1440, height: 1000 }
			}
		}
	],
	webServer: {
		command: 'npm run preview -- --host 127.0.0.1 --port 4174',
		url: 'http://127.0.0.1:4174/team-maker/',
		reuseExistingServer: false,
		timeout: 120_000
	}
});
