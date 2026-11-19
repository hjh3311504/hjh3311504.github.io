import { publicPaths, readPosts } from '$lib/server/blog.js';
import {
	aramAugmentPaths,
	aramChampionPaths,
	aramUnindexedChampionPaths
} from '$lib/aram-mayhem/seo.js';
import { adsenseExcludedPaths } from '$lib/data/meta.js';

export async function load() {
	// 예약 글과 초안의 경로는 운영 브라우저에 전달하지 않는다.
	// 아수라장 챔피언·증강 공략 페이지도 광고·방문 통계를 쓰는 공개 경로다.
	return {
		analyticsPublicPaths: [
			...publicPaths(await readPosts()),
			...aramChampionPaths(),
			...aramAugmentPaths()
		],
		// 조합이 없는 챔피언 공략은 방문 통계만 쓰고 광고 코드는 넣지 않는다.
		adsenseExcludedPaths: [...adsenseExcludedPaths, ...aramUnindexedChampionPaths()]
	};
}
