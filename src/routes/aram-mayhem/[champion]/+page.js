import { error } from '@sveltejs/kit';
import guide from '$lib/aram-mayhem/guide-data.json';

// 가이드에 있는 챔피언마다 build/aram-mayhem/챔피언id.html을 만든다.
export const entries = () => guide.champions.map((champion) => ({ champion: champion.id }));

export function load({ params }) {
	if (!guide.champions.some((champion) => champion.id === params.champion)) {
		error(404, '챔피언 공략을 찾을 수 없습니다.');
	}
	return { championId: params.champion };
}
