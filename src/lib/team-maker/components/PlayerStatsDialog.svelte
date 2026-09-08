<script>
	import { Dialog, EmptyState } from '$lib/components/ui';
</script>

<Dialog
	id="player-stats-dialog"
	class="app-dialog stats-dialog"
	title="참가자 통계"
	titleId="player-stats-title"
	description="기록이 없습니다."
	descriptionId="player-stats-description"
	describedBy="player-stats-description"
>
	<EmptyState as="p" id="player-stats-empty" class="subtle-empty">
		오늘 기록이 없습니다. 결과 카드에서 승리를 기록하면 여기에 쌓입니다. 지난 기록은 전체 기록의
		전체 통계에서 볼 수 있습니다.
	</EmptyState>
	<div id="player-stats-body" class="stats-body" hidden>
		<ul id="player-stats-leaders" class="stats-leader-list"></ul>
		<p class="stats-note">
			오늘 저장한 경기만 셉니다. 3팀 이상 경기에서는 2등부터 모두 패로 셉니다.
		</p>
		<div class="stats-section">
			<h3 id="player-stats-pairs-title">베스트 팀 조합</h3>
			<EmptyState as="p" id="player-stats-pairs-empty" class="subtle-empty" hidden>
				두 경기 이상 같은 팀이었던 조합이 없습니다.
			</EmptyState>
			<ul
				id="player-stats-pairs"
				class="stats-pair-list"
				aria-labelledby="player-stats-pairs-title"
			></ul>
		</div>
		<div class="stats-section player-records-section">
			<h3 id="player-stats-table-title">참가자별 기록</h3>
			<div class="stats-table-wrap">
				<table class="stats-table" aria-labelledby="player-stats-table-title">
					<thead>
						<tr>
							<th scope="col">등수</th>
							<th scope="col">이름</th>
							<th scope="col">경기</th>
							<th scope="col">승</th>
							<th scope="col">패</th>
							<th scope="col">당첨</th>
						</tr>
					</thead>
					<tbody id="player-stats-rows"></tbody>
				</table>
			</div>
		</div>
	</div>
</Dialog>
