import { expect, test } from '@playwright/test';
import { stubAdsense } from './helpers/adsense.js';

const statImage = /\/stat-(win|pick|lose)\.[^/]+$/;

async function openStats(page) {
	await page.addInitScript(() => {
		localStorage.setItem(
			'team-maker:v1',
			JSON.stringify({
				version: 2,
				history: [
					{
						id: 'image-test',
						occurredAt: new Date().toISOString(),
						ranking: [1, 2],
						winnerTeamId: 1,
						teams: [
							{ id: 1, name: '1팀', members: ['가영'], picks: ['가영'] },
							{ id: 2, name: '2팀', members: ['나연'], picks: [] }
						]
					}
				]
			})
		);
	});
	await page.goto('/team-maker');
	await page.getByRole('button', { name: '참가자 통계', exact: true }).click();
	return page.getByRole('dialog', { name: '참가자 통계', exact: true });
}

for (const width of [1440, 390]) {
	test(`통계 SVG와 당첨 마스크를 ${width}px 화면에서 표시한다`, async ({ page }) => {
		await page.setViewportSize({ width, height: 1000 });
		await stubAdsense(page);
		const errors = [];
		page.on('pageerror', (error) => errors.push(error.message));
		page.on('console', (message) => {
			if (message.type() === 'error') errors.push(message.text());
		});
		const requests = [];
		page.on('request', (request) => {
			if (statImage.test(request.url())) requests.push(request.url());
		});
		const dialog = await openStats(page);
		const images = dialog.locator('.stats-leader-icon img');
		await expect(images).toHaveCount(3);
		for (let index = 0; index < 3; index++) {
			const image = images.nth(index);
			await expect(image).toHaveAttribute('src', /\.svg$/);
			await expect
				.poll(() => image.evaluate((img) => img.complete && img.naturalWidth > 0))
				.toBe(true);
			const layout = await image.evaluate((img) => ({
				width: getComputedStyle(img).width,
				height: getComputedStyle(img).height,
				fit: getComputedStyle(img).objectFit,
				mask: img.parentElement.style.getPropertyValue('--stats-leader-icon-image'),
				src: img.getAttribute('src'),
				background: getComputedStyle(img.parentElement).backgroundColor,
				parentWidth: img.parentElement.getBoundingClientRect().width,
				parentHeight: img.parentElement.getBoundingClientRect().height
			}));
			expect(layout).toMatchObject({
				width: '50px',
				height: '50px',
				fit: 'contain',
				parentWidth: 52,
				parentHeight: 52
			});
			expect(layout.mask).toBe(`url("${layout.src}")`);
			expect(layout.background).not.toBe('rgba(0, 0, 0, 0)');
		}
		const names = requests.map((url) => url.split('/').pop());
		expect([...new Set(names)].sort()).toEqual(['stat-lose.svg', 'stat-pick.svg', 'stat-win.svg']);
		const pickMask = await images.nth(1).evaluate((img) => {
			const style = getComputedStyle(img.parentElement, '::before');
			return { image: style.maskImage, color: style.backgroundColor };
		});
		expect(pickMask.image).toContain('stat-pick.svg');
		// CSS 변수를 실제 색으로 계산해 초록 마스크가 유지되는지 확인합니다.
		const green = await dialog.evaluate((element) => {
			const probe = document.createElement('span');
			probe.style.color = 'var(--green)';
			element.append(probe);
			const color = getComputedStyle(probe).color;
			probe.remove();
			return color;
		});
		expect(pickMask.color).toBe(green);
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
			width
		);
		expect(errors).toEqual([]);
	});
}
