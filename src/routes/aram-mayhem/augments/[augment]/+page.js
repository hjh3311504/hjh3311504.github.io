import { error } from '@sveltejs/kit';
import { AUGMENT_PAGE_IDS } from '$lib/aram-mayhem/seo.js';

// 증강 공략 페이지마다 build/aram-mayhem/augments/증강id.html을 만든다.
export const entries = () => AUGMENT_PAGE_IDS.map((augment) => ({ augment }));

export function load({ params }) {
	if (!AUGMENT_PAGE_IDS.includes(params.augment)) error(404, '증강 공략을 찾을 수 없습니다.');
	return { augmentId: params.augment };
}
