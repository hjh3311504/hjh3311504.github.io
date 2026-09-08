<script>
	import { Button, Dialog, IconButton } from '$lib/components/ui';
</script>

<Dialog
	id="wheel-dialog"
	class="app-dialog wheel-dialog"
	title="1팀 뽑기"
	titleId="wheel-title"
	description="이 팀 명단 중 한 명을 무작위로 뽑습니다."
	descriptionId="wheel-description"
	describedBy="wheel-description"
	actionsClass="split-actions"
>
	{#snippet beforeHeader()}
		<div id="celebration-layer" class="celebration-layer" aria-hidden="true" hidden></div>
	{/snippet}
	{#snippet headerActions()}
		<IconButton
			id="sound-toggle-button"
			class="dialog-close sound-toggle"
			variant="ghost"
			aria-pressed="true"
			label="효과음 끄기"
			title="효과음 끄기"
		>
			<svg
				width="17"
				height="17"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M11 5 6 9H3v6h3l5 4V5z"></path>
				<path id="sound-wave-path" d="M15.5 8.5a5 5 0 0 1 0 7"></path>
			</svg>
		</IconButton>
	{/snippet}
	<div class="wheel-body">
		<div id="wheel-wrap" class="wheel-wrap">
			<span class="wheel-pointer" aria-hidden="true"></span>
			<div id="wheel" class="wheel" aria-hidden="true"></div>
		</div>
		<div id="wheel-side" class="wheel-side picked-card" aria-labelledby="wheel-side-title" hidden>
			<div class="wheel-side-head">
				<h3 id="wheel-side-title" class="wheel-side-title">당첨자</h3>
				<Button id="clear-picks-button" class="picked-clear" variant="ghost">명단 삭제</Button>
			</div>
			<ol id="wheel-picked-list" class="wheel-picked-list" aria-labelledby="wheel-side-title"></ol>
		</div>
	</div>
	<div id="wheel-result" class="wheel-result" role="status">돌리기를 누르세요.</div>
	{#snippet actions()}
		<Button id="wheel-close-button" class="utility-button" variant="outline" data-close-dialog>
			닫기
		</Button>
		<Button id="spin-wheel-button" class="primary-small-button" variant="primary">돌리기</Button>
	{/snippet}
</Dialog>
