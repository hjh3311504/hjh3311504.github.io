<script>
	import { DisclosureSection } from '$lib/components/ui';
</script>

<div class="bracket-guide">
	<DisclosureSection open title="대진표, 이렇게 사용하세요" titleId="bracket-guide-title">
		<ol class="bracket-guide-steps">
			<li>
				<h3>1. 팀 넣기</h3>
				<p>
					팀 이름을 적고 엔터를 누르세요. 쉼표로 여러 팀을 한 번에 넣거나 ‘일괄 추가’로 붙여 넣을 수
					있습니다. 손잡이를 끌어 순서를 바꾸면 그 순서가 시드가 됩니다. 팀 메이커에서 팀을 나눴다면
					결과 아래의 ‘대진표 만들기’를 누르세요. 팀 이름과 팀원이 그대로 넘어옵니다.
				</p>
			</li>
			<li>
				<h3>2. 대진표 만들기</h3>
				<p>
					입력 순서는 위에 있는 팀이 높은 시드가 됩니다. 시드는 강한 팀끼리 일찍 만나지 않도록 정한
					순번입니다. 무작위를 고르면 팀 순서를 섞어서 배치합니다. 어느 라운드든 남은 팀 수가 홀수면
					1팀만 부전승으로 다음 라운드에 올라갑니다.
				</p>
			</li>
			<li>
				<h3>3. 이긴 팀 누르기</h3>
				<p>
					경기에서 이긴 팀을 누르면 다음 라운드로 올라갑니다. 다시 누르면 취소됩니다. 행사장에서는
					전체화면으로 띄우고, 인쇄하면 화면과 같은 모양으로 A4 가로 한 장에 들어갑니다.
				</p>
			</li>
		</ol>
	</DisclosureSection>
	<DisclosureSection open title="6팀이면 이렇게 배치돼요" titleId="bracket-example-title">
		<p class="bracket-guide-intro">
			가상의 팀 6개를 입력 순서로 넣은 예제입니다. 8강에서는 6팀이 모두 경기합니다. 이긴 3팀이 4강에
			오르므로 4강에서 1팀이 부전승을 받습니다.
		</p>
		<table class="bracket-example">
			<caption>6팀 입력 순서 배치의 라운드별 경기</caption>
			<thead>
				<tr
					><th scope="col">경기</th><th scope="col">위 칸</th><th scope="col">아래 칸</th><th
						scope="col">결과</th
					></tr
				>
			</thead>
			<tbody>
				<tr><td>8강 1경기</td><td>1번 호랑이</td><td>6번 곰</td><td>경기</td></tr>
				<tr><td>8강 2경기</td><td>2번 늑대</td><td>5번 상어</td><td>경기</td></tr>
				<tr><td>8강 3경기</td><td>3번 여우</td><td>4번 독수리</td><td>경기</td></tr>
				<tr><td>4강 부전승</td><td>8강 1경기 승자</td><td>부전승</td><td>결승에 바로 올라감</td></tr
				>
				<tr><td>4강 1경기</td><td>8강 2경기 승자</td><td>8강 3경기 승자</td><td>경기</td></tr>
				<tr><td>결승</td><td>4강 부전승 팀</td><td>4강 1경기 승자</td><td>우승 결정</td></tr>
			</tbody>
		</table>
		<p class="bracket-guide-intro">
			실제 경기는 5개입니다. 팀 수에서 1을 빼면 전체 경기 수가 됩니다. 1번과 2번 시드는 결승에서야
			만납니다.
		</p>
	</DisclosureSection>
	<DisclosureSection open title="자주 묻는 질문" titleId="bracket-faq-title">
		<div class="bracket-faq">
			<article>
				<h3>부전승은 누가 받나요?</h3>
				<p>
					남은 팀 수가 홀수인 라운드에서만 1팀이 받습니다. 시드가 높은 쪽이 먼저 받지만, 같은 팀이
					두 라운드 연속으로 받지는 않습니다. 예를 들어 5팀이면 8강에서 2번 시드가, 4강에서 1번 시드
					쪽 경기의 승자가 부전승을 받습니다.
				</p>
			</article>
			<article>
				<h3>결과는 어디에 저장되나요?</h3>
				<p>
					이 브라우저의 저장 공간(localStorage)에 대진표 1개만 저장됩니다. 서버로 보내지 않습니다.
					다른 기기나 다른 브라우저에서는 보이지 않고, 브라우저 데이터를 지우면 함께 사라집니다.
				</p>
			</article>
			<article>
				<h3>인쇄가 한 장에 안 들어가요.</h3>
				<p>
					인쇄 설정에서 용지를 A4, 방향을 가로, 배율을 기본값이나 100%로 맞추세요. 머리글과 바닥글을
					끄면 더 넉넉합니다. 색이 빠지면 배경 그래픽 인쇄를 켜세요. 결과를 기록하기 전에 인쇄하면
					‘앞 경기 승자’ 칸에 손으로 적을 수 있습니다.
				</p>
			</article>
			<article>
				<h3>17팀 이상도 되나요?</h3>
				<p>
					32팀까지 만들 수 있습니다. 팀이 많으면 넓은 화면과 인쇄에서 왼쪽과 오른쪽 절반이 가운데
					결승에서 만나는 대칭 모양으로 그리고, 화면 한 번이나 A4 가로 한 장에 들어가게 줄입니다.
					33팀 이상은 조를 나눠 대진표를 여러 개 만드세요.
				</p>
			</article>
		</div>
	</DisclosureSection>
</div>
