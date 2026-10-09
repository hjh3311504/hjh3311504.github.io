// Playwright CLI의 run-code로 실행한다. 새 임시 환경에만 가상 명단을 저장한다.
export default async function measureStorage(page) {
	const browser = page.context().browser();
	const baseURL = page.url();
	const url = new URL('/team-maker', baseURL).href;
	if (!['127.0.0.1', 'localhost'].includes(new URL(url).hostname))
		throw new Error('로컬 개발 서버에서만 실행하세요.');
	const contexts = [];
	async function fresh() {
		const context = await browser.newContext({
			viewport: { width: 1100, height: 900 },
			locale: 'ko-KR',
			timezoneId: 'Asia/Seoul',
			colorScheme: 'light',
			reducedMotion: 'reduce'
		});
		contexts.push(context);
		const tab = await context.newPage();
		await tab.goto(url);
		await tab.locator('#person-name').waitFor();
		// Svelte mount 후 Team Maker의 이벤트 연결이 완료되었는지 확인한다.
		await tab.waitForFunction(() => document.title.startsWith('[로컬]'));
		return { context, tab };
	}
	async function readState(tab) {
		return tab.evaluate(() => {
			const saved = JSON.parse(localStorage.getItem('team-maker:v1') || 'null');
			return {
				visibleParticipants: document.querySelectorAll('#participant-list .participant-name')
					.length,
				storedParticipants: saved?.participants?.length || 0,
				rosters: saved?.rosters?.length || 0
			};
		});
	}
	async function check(tab, participants, rosters) {
		await tab.waitForFunction(
			(count) => document.querySelectorAll('#participant-list .participant-name').length === count,
			participants
		);
		const state = await readState(tab);
		if (state.storedParticipants !== participants || state.rosters !== rosters)
			throw new Error(JSON.stringify(state));
		return state;
	}
	try {
		const first = await fresh();
		await first.tab.locator('#person-name').fill('가람, 나래, 다온');
		await first.tab.locator('#person-name').press('Enter');
		await check(first.tab, 3, 0);
		await first.tab.locator('#open-rosters-button').click();
		await first.tab.locator('#roster-name').fill('블로그 실험 명단');
		await first.tab.locator('#save-roster-button').click();
		const saved = await check(first.tab, 3, 1);
		await first.tab.locator('#rosters-list .roster-row').waitFor();
		await first.tab
			.locator('#roster-dialog')
			.screenshot({ path: 'static/images/blog/browser-storage/saved-roster.png' });
		await first.tab.keyboard.press('Escape');
		await first.tab.reload();
		const reloaded = await check(first.tab, 3, 1);
		const secondTab = await first.context.newPage();
		await secondTab.goto(url);
		const sameContext = await check(secondTab, 3, 1);
		await secondTab.close();
		const separate = await fresh();
		const isolated = await check(separate.tab, 0, 0);
		const originalUnchanged = await check(first.tab, 3, 1);
		const cdp = await first.context.newCDPSession(first.tab);
		await cdp.send('Storage.clearDataForOrigin', {
			origin: new URL(url).origin,
			storageTypes: 'local_storage'
		});
		await cdp.detach();
		await first.tab.reload();
		const deleted = await check(first.tab, 0, 0);
		await first.tab.locator('#open-rosters-button').click();
		await first.tab.locator('#rosters-empty').waitFor({ state: 'visible' });
		await first.tab
			.locator('#roster-dialog')
			.screenshot({ path: 'static/images/blog/browser-storage/deleted-roster.png' });
		await separate.tab.locator('#person-name').fill('가람');
		await separate.tab.locator('#person-name').press('Enter');
		await check(separate.tab, 1, 0);
		await separate.context.close();
		contexts.splice(contexts.indexOf(separate.context), 1);
		const reopened = await fresh();
		const afterPrivateContextClose = await check(reopened.tab, 0, 0);
		return {
			measuredAt: new Date().toISOString(),
			browser: browser.version(),
			origin: new URL(url).origin,
			method:
				'Playwright isolated non-persistent browser contexts; no real user profile; localStorage cleared through Chromium DevTools Protocol',
			names: ['가람', '나래', '다온'],
			rosterName: '블로그 실험 명단',
			cases: {
				saved,
				reloaded,
				sameContext,
				isolated,
				originalUnchanged,
				deleted,
				afterPrivateContextClose
			},
			limitations: [
				'No regular browser process restart tested',
				'No physical second device tested',
				'No Chrome settings UI operated',
				'No deleted data recovery tested'
			]
		};
	} finally {
		for (const context of contexts) await context.close();
	}
}
