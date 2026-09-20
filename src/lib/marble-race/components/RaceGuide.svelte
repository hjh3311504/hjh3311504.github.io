<script>
	import { resolve } from '$app/paths';
	import { DisclosureSection } from '$lib/components/ui';
	import { guideSteps, drawMethods, faqs } from '../page-content.js';
</script>

<div class="marble-guide" data-testid="marble-race-guide">
	<DisclosureSection title="ASMR 구슬 추첨기 사용법" titleId="marble-guide-title">
		<p class="guide-intro">
			ASMR 구슬 레이스는 이름을 넣고 블록이 깨지는 소리를 들으며 당첨자를 뽑는 무료 온라인
			추첨기입니다. 수업 발표자 뽑기, 방송 이벤트, 모임의 순서 정하기에 활용할 수 있습니다.
		</p>
		<ol class="guide-grid">
			{#each guideSteps as step (step.title)}<li>
					<h3>{step.title}</h3>
					<p>{step.text}</p>
				</li>{/each}
		</ol>
	</DisclosureSection>
	<DisclosureSection title="4가지 당첨 방식" titleId="marble-methods-title">
		<div class="guide-grid guide-methods">
			{#each drawMethods as method (method.title)}<article>
					<h3>{method.title}</h3>
					<p>{method.text}</p>
				</article>{/each}
		</div>
	</DisclosureSection>
	<DisclosureSection title="수업·방송에서 이렇게 활용하세요" titleId="marble-uses-title">
		<p class="guide-intro">
			다음은 가상 참가자 10명 중 4~6번째로 도착한 3명을 뽑는 예제입니다. 한 사람에게 구슬 1개씩을
			배정합니다.
		</p>
		<ol class="guide-grid guide-methods">
			<li>
				<h3>명단과 당첨 순위 정하기</h3>
				<p>
					가람, 나래, 다온, 라온, 마루, 바다, 새봄, 아라, 하늘, 한결을 입력하세요. 참가자가 10명인지
					확인한 뒤 ‘여러명’을 선택하고 시작 순위에 4, 끝 순위에 6을 넣으세요. 1~3번째 도착자는
					당첨되지 않습니다.
				</p>
			</li>
			<li>
				<h3>출발 전에 경기 설정하기</h3>
				<p>
					‘도각도각 키보드’ 맵을 고르고 소리를 미리 들어 보세요. ‘자리섞기’는 출발 위치를 다시
					배치합니다. 주변 구슬을 밀어내는 파동을 사용하려면 ‘스킬 사용’을 ON으로, 사용하지 않으려면
					OFF로 정하세요. 참가자와 설정은 시작 전에 함께 확인하세요.
				</p>
			</li>
			<li>
				<h3>함께 보고 결과 남기기</h3>
				<p>
					‘구슬 굴리기’를 누르면 경기가 시작됩니다. 수업이나 모임에서는 전체화면으로 보여 주고
					상황에 맞게 음량을 조절하세요. 4·5·6번째 구슬이 당첨된 뒤 경기가 끝나면 ‘결과 복사’로 전체
					결과를 메모에 붙여넣으세요. 경기 결과는 저장되지 않으므로 페이지를 떠나기 전에 남겨
					두세요.
				</p>
			</li>
			<li>
				<h3>당첨 방식의 한계 이해하기</h3>
				<p>
					구슬의 출발 위치와 충돌, 맵과 스킬이 도착 순서에 영향을 줍니다. 자리섞기를 해도 모든
					참가자의 당첨 확률이 같다고 보장하지 않습니다. 같은 사람의 이름을 여러 번 넣으면 그 사람의
					구슬도 여러 개 생기므로 명단과 추첨 기준을 참가자에게 미리 알려 주세요.
				</p>
			</li>
		</ol>
		<p class="guide-links">
			활동할 팀이 필요하면 <a href={resolve('/team-maker')}>팀 메이커로 팀 나누기</a>, 참여 링크를
			보여주려면 <a href={resolve('/qr-code')}>QR 코드 만들기</a>를 이용하세요.
		</p>
	</DisclosureSection>
	<DisclosureSection title="자주 묻는 질문" titleId="marble-faq-title">
		<div class="guide-faq">
			{#each faqs as faq (faq.question)}<article>
					<h3>{faq.question}</h3>
					<p>{faq.answer}</p>
				</article>{/each}
		</div>
	</DisclosureSection>
</div>

<style>
	.marble-guide {
		display: grid;
		gap: var(--space-16);
		margin-top: var(--space-32);
	}
	.guide-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-24);
		padding: 0;
		margin: 0;
		list-style-position: inside;
	}
	.guide-methods {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	.guide-grid li::marker {
		color: var(--ui-text-muted);
		font-weight: 700;
	}
	h3 {
		margin: 0 0 var(--space-8);
		font-size: var(--font-size-18);
		line-height: 1.5;
		color: var(--ui-text);
	}
	li h3 {
		display: inline;
	}
	p {
		margin: var(--space-8) 0 0;
		font-size: var(--font-size-16);
		line-height: 1.75;
		color: var(--ui-text-muted);
		word-break: keep-all;
		overflow-wrap: anywhere;
	}
	p.guide-intro {
		margin: 0 0 var(--space-24);
	}
	p.guide-links {
		margin-top: var(--space-24);
	}
	.guide-faq {
		display: grid;
		gap: var(--space-24);
	}
	a {
		color: var(--ui-primary);
		text-decoration: underline;
		text-underline-offset: 4px;
	}
	@media (max-width: 760px) {
		.guide-grid {
			grid-template-columns: 1fr;
			gap: var(--space-20);
		}
	}
</style>
