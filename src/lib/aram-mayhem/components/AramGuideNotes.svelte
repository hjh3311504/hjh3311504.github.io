<script>
	import { DisclosureSection } from '$lib/components/ui';

	let { patch, championCount } = $props();
</script>

<div class="aram-notes">
	<DisclosureSection open title="가이드 보는 법" titleId="aram-howto-title">
		<ol class="aram-notes-list">
			<li>
				<h3>1. 챔피언 고르기</h3>
				<p>
					이름을 검색하거나 역할을 눌러 챔피언을 찾으세요. 고른 챔피언은 주소 끝에 붙어서 그대로
					공유할 수 있습니다.
				</p>
			</li>
			<li>
				<h3>2. 아이템 순서 보기</h3>
				<p>
					화살표 순서대로 코어 아이템을 사세요. 코어는 먼저 완성할 핵심 아이템입니다. 기본 빌드가
					여러 개면 탭으로 고릅니다. 증강 이름이 붙은 탭은 그 증강을 얻었을 때 바꾸는 빌드입니다.
					기본 빌드와 다른 아이템에는 ‘추가’나 ‘변경’ 표시가 붙습니다.
				</p>
			</li>
			<li>
				<h3>3. 증강 고르기</h3>
				<p>
					실선 증강은 조합에 꼭 필요한 필수 증강입니다. 점선 증강은 있으면 더 좋은 선택 증강입니다.
					증강 이름을 누르면 효과를 볼 수 있습니다.
				</p>
			</li>
		</ol>
	</DisclosureSection>
	<DisclosureSection title="추천 기준과 자료" titleId="aram-basis-title">
		<p class="aram-notes-text">
			칼바람 아수라장 {patch} 패치 기준으로 챔피언 {championCount}명을 정리했습니다. 공개 통계에서
			승률이 높은 증강과 아이템을 고르고, 디시인사이드 칼바람 나락 갤러리와 유튜브의 실전 공략을
			함께 확인했습니다. 카드의 출처 링크는 그 조합을 정리할 때 참고한 글과 영상입니다.
		</p>
		<p class="aram-notes-text">
			‘강력 추천’은 통계와 실전 공략이 함께 강하다고 말하는 조합입니다. ‘추천’은 효과가 잘 맞지만
			근거가 그보다 적은 조합입니다. 승률은 증강을 하나씩 고른 경기의 값이라 여러 증강을 함께 고른
			결과를 보장하지 않습니다. 패치마다 수치가 바뀌니 게임 안의 설명도 함께 확인하세요.
		</p>
	</DisclosureSection>
</div>
