<script>
	import { Button, Dialog, EmptyState } from '$lib/components/ui';
</script>

<Dialog
	id="history-dialog"
	class="app-dialog history-dialog"
	title="전체 기록"
	titleId="history-title"
	descriptionId="history-description"
	describedBy="history-description"
>
	{#snippet descriptionContent()}
		<span id="history-description-count">기록이 없습니다.</span>
		<span id="history-description-legend" hidden>* 당첨자</span>
	{/snippet}
	<div class="modal-tabs" role="tablist" aria-label="전체 기록 보기">
		<Button
			id="history-log-tab"
			class="modal-tab"
			variant="ghost"
			role="tab"
			aria-selected="true"
			aria-controls="history-log-panel">경기 기록</Button
		>
		<Button
			id="history-stats-tab"
			class="modal-tab"
			variant="ghost"
			role="tab"
			aria-selected="false"
			aria-controls="history-stats-panel">전체 통계</Button
		>
	</div>
	<div id="history-log-panel" class="modal-panel" role="tabpanel" aria-labelledby="history-log-tab">
		<EmptyState as="p" id="history-empty" class="subtle-empty">
			아직 기록이 없습니다. 결과 카드의 승리 버튼을 눌러 기록해 보세요.
		</EmptyState>
		<div id="history-groups" class="history-groups"></div>
	</div>
	<div
		id="history-stats-panel"
		class="modal-panel"
		role="tabpanel"
		aria-labelledby="history-stats-tab"
		hidden
	>
		<div id="history-overview" class="history-overview overview" hidden>
			<ul id="history-overview-facts" class="overview-facts"></ul>
			<div class="overview-block">
				<div class="overview-block-head">
					<h3 id="history-overview-title" class="overview-block-title">승리 순위</h3>
					<div class="overview-sort-wrap">
						<Button
							id="history-sort-button"
							class="utility-button overview-sort"
							variant="outline"
							aria-haspopup="true"
							aria-expanded="false"
							aria-controls="history-sort-menu">승리순</Button
						>
						<ul
							id="history-sort-menu"
							class="sort-menu"
							role="menu"
							aria-labelledby="history-sort-button"
							hidden
						>
							<li role="none">
								<Button
									class="sort-item"
									variant="ghost"
									role="menuitemradio"
									data-history-sort="wins"
									aria-checked="true"
									><span class="sort-item-label">승리순</span><span class="sort-item-desc"
										>승리 수가 많은 참가자부터</span
									></Button
								>
							</li>
							<li role="none">
								<Button
									class="sort-item"
									variant="ghost"
									role="menuitemradio"
									data-history-sort="rate"
									aria-checked="false"
									><span class="sort-item-label">1등 확률순</span><span class="sort-item-desc"
										>1등 확률이 높은 참가자부터</span
									></Button
								>
							</li>
							<li role="none">
								<Button
									class="sort-item"
									variant="ghost"
									role="menuitemradio"
									data-history-sort="picks"
									aria-checked="false"
									><span class="sort-item-label">당첨순</span><span class="sort-item-desc"
										>누적 당첨 횟수가 많은 참가자부터</span
									></Button
								>
							</li>
						</ul>
					</div>
				</div>
				<ol id="history-overview-podium" class="podium" aria-label="선택한 기준의 1위부터 3위"></ol>
			</div>
			<div class="overview-block">
				<div class="overview-block-head">
					<h3 class="overview-block-title">전체 순위</h3>
					<label class="overview-search">
						<span class="sr-only">참가자 검색</span>
						<input id="history-search" type="search" placeholder="참가자 검색" autocomplete="off" />
					</label>
				</div>
				<div class="rank-table-wrap">
					<table class="rank-table">
						<thead>
							<tr
								><th scope="col">순위</th><th scope="col">참가자</th><th scope="col">전적</th><th
									scope="col">1등 확률</th
								><th scope="col">당첨</th></tr
							>
						</thead>
						<tbody id="history-overview-ranking"></tbody>
					</table>
				</div>
			</div>
			<p class="stats-note">
				막대와 백분율은 1등 확률입니다. 3팀 이상 경기에서는 2등부터 모두 패로 셉니다.
			</p>
		</div>
	</div>
</Dialog>
