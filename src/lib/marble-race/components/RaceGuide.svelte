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
		<div class="guide-grid guide-methods">
			<article>
				<h3>교실에서 발표자 뽑기</h3>
				<p>
					학생 이름을 넣고 첫번째 또는 n번째 추첨으로 발표자를 정해 보세요. 전체화면으로 함께 보고,
					수업에 맞게 소리를 줄이거나 끌 수 있습니다.
				</p>
			</article>
			<article>
				<h3>인터넷 방송 이벤트</h3>
				<p>
					참여자 닉네임과 당첨 순위를 정한 뒤 방송 프로그램에서 경기 화면을 공유하세요. 여러명
					방식으로 당첨 범위를 지정하고 결과를 복사할 수 있습니다.
				</p>
			</article>
		</div>
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
		gap: 16px;
		margin-top: 32px;
	}
	.guide-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 24px;
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
		margin: 0 0 8px;
		font-size: 18px;
		line-height: 1.5;
		color: var(--ui-text);
	}
	li h3 {
		display: inline;
	}
	p {
		margin: 8px 0 0;
		font-size: 16px;
		line-height: 1.75;
		color: var(--ui-text-muted);
		word-break: keep-all;
		overflow-wrap: anywhere;
	}
	p.guide-intro {
		margin: 0 0 24px;
	}
	p.guide-links {
		margin-top: 24px;
	}
	.guide-faq {
		display: grid;
		gap: 24px;
	}
	a {
		color: var(--ui-primary);
		text-decoration: underline;
		text-underline-offset: 4px;
	}
	@media (max-width: 760px) {
		.guide-grid {
			grid-template-columns: 1fr;
			gap: 20px;
		}
	}
</style>
