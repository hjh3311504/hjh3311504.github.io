import { expect, test } from '@playwright/test';

const statImage = /\/stat-(win|pick|lose)\.(webp|png)$/;

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

for (const fallback of [false, true]) {
	test(`통계 아이콘은 ${fallback ? 'WebP 해독 실패 시 PNG와 마스크로 전환한다' : 'WebP를 요청하고 PNG는 요청하지 않는다'}`, async ({
		page
	}) => {
		const errors = [];
		page.on('pageerror', (error) => errors.push(error.message));
		page.on('console', (message) => {
			if (message.type() === 'error') errors.push(message.text());
		});
		const requests = [];
		page.on('request', (request) => {
			if (statImage.test(request.url())) requests.push(request.url());
		});
		if (fallback) {
			// HTTP 오류 대신 해독할 수 없는 이미지를 전달해 기존 오류 검사를 유지합니다.
			await page.route(/\/stat-(win|pick|lose)\.webp$/, (route) =>
				route.fulfill({ contentType: 'image/webp', body: 'invalid image' })
			);
		}
		const dialog = await openStats(page);
		const images = dialog.locator('.stats-leader-icon img');
		await expect(images).toHaveCount(3);
		for (let index = 0; index < 3; index++) {
			const image = images.nth(index);
			await expect(image).toHaveAttribute('src', new RegExp(`\\.${fallback ? 'png' : 'webp'}$`));
			await expect
				.poll(() => image.evaluate((img) => img.complete && img.naturalWidth > 0))
				.toBe(true);
			const layout = await image.evaluate((img) => ({
				width: getComputedStyle(img).width,
				height: getComputedStyle(img).height,
				fit: getComputedStyle(img).objectFit,
				mask: img.parentElement.style.getPropertyValue('--stats-leader-icon-image'),
				src: img.getAttribute('src')
			}));
			expect(layout).toMatchObject({ width: '50px', height: '50px', fit: 'contain' });
			expect(layout.mask).toBe(`url("${layout.src}")`);
			if (fallback) {
				// PNG까지 실패해도 다시 대체 요청을 만들지 않습니다.
				await image.dispatchEvent('error');
				await expect(image).toHaveAttribute('src', layout.src);
			}
		}
		expect(new Set(requests.filter((url) => url.endsWith('.webp')))).toHaveProperty('size', 3);
		expect(new Set(requests.filter((url) => url.endsWith('.png')))).toHaveProperty(
			'size',
			fallback ? 3 : 0
		);
		// 당첨 아이콘은 img와 CSS 마스크가 같은 파일을 각각 요청합니다.
		const names = ['stat-win', 'stat-pick', 'stat-pick', 'stat-lose'];
		const expected = names.map((name) => `${name}.webp`);
		if (fallback) expected.push(...names.map((name) => `${name}.png`));
		expect(requests.map((url) => url.split('/').pop()).sort()).toEqual(expected.sort());
		expect(
			await images
				.nth(1)
				.evaluate((img) => getComputedStyle(img.parentElement, '::before').maskImage)
		).toContain(`stat-pick.${fallback ? 'png' : 'webp'}`);
		expect(errors).toEqual([]);
	});
}
