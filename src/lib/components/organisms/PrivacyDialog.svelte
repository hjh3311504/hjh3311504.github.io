<script>
	import { Button, Dialog } from '$lib/components/ui';

	let { triggerClass = '', triggerSuffix = '' } = $props();
	let dialog = $state();

	function openDialog() {
		if (!dialog?.open) dialog?.showModal();
	}

	function closeDialog() {
		if (dialog?.open) dialog.close();
	}

	function closeFromBackdrop(event) {
		if (event.target !== dialog) return;
		const bounds = dialog.getBoundingClientRect();
		if (
			event.clientX < bounds.left ||
			event.clientX > bounds.right ||
			event.clientY < bounds.top ||
			event.clientY > bounds.bottom
		) {
			closeDialog();
		}
	}
</script>

<Button
	class={['privacy-trigger', triggerClass].filter(Boolean).join(' ')}
	variant="ghost"
	onclick={openDialog}
>
	개인정보처리방침{triggerSuffix}
</Button>

<Dialog
	bind:element={dialog}
	id="privacy-dialog"
	class="privacy-dialog"
	title="개인정보처리방침"
	titleId="privacy-title"
	descriptionId="privacy-summary"
	describedBy="privacy-summary"
	closeLabel="개인정보처리방침 닫기"
	closeAction={closeDialog}
	onclick={closeFromBackdrop}
>
	{#snippet descriptionContent()}
		운영자: Lake · 적용일: <time datetime="2026-09-11">2026년 9월 11일</time>
	{/snippet}

	<div class="privacy-content">
		<h3>브라우저에 저장하는 정보</h3>
		<p>
			팀 메이커의 참가자 이름, 참가 여부, 배정 규칙, 저장 명단, 경기 기록과 설정은 현재 브라우저의
			저장 공간인 localStorage에 보관합니다. QR 코드의 북마크에는 입력한 주소·텍스트와 제목을
			저장합니다. 북마크에 추가하지 않은 QR 입력은 저장하지 않습니다. 사이트의 테마와 메뉴 고정
			설정도 같은 방식으로 저장합니다. 입력 내용과 설정을 다시 불러오기 위한 용도이며, 사이트 코드가
			이 정보를 운영자 서버로 전송하지 않습니다.
		</p>

		<h3>저장 기간과 삭제 방법</h3>
		<p>
			저장 정보는 사용자가 삭제하거나 브라우저가 저장 공간을 정리할 때까지 남습니다. 다른 기기나
			브라우저로 자동으로 옮겨지지 않습니다. QR 북마크, 저장 명단과 경기 기록은 각각의 삭제 기능으로
			지울 수 있습니다. 모든 정보를 지우려면 브라우저 설정에서 이 사이트의 저장 데이터를 삭제하세요.
			현재 참가자만 삭제해도 저장 명단과 과거 기록은 남습니다. 운영자는 브라우저에 저장된 데이터를
			조회하거나 복구할 수 없습니다.
		</p>

		<h3>사이트 접속과 외부 서비스</h3>
		<p>
			이 사이트와 글꼴은 GitHub Pages에서 제공합니다. 사이트에 접속하면 GitHub에 IP 주소와 브라우저
			정보 등 접속 정보가 전달될 수 있습니다. 자세한 처리 내용은
			<a
				href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
				>GitHub 개인정보처리방침</a
			>에서 확인하세요.
		</p>

		<h3>광고와 방문자 분석</h3>
		<p>
			현재 Google 애드센스 광고 코드와 별도의 방문자 분석 코드를 실행하지 않습니다. 앞으로 Google
			광고를 도입하면 Google 등 제3자가 광고 제공·측정을 위해 쿠키를 읽거나 저장하고, IP 주소나 기기
			식별자 등을 사용할 수 있습니다. 광고를 시작하기 전에 실제 설정에 맞게 이 방침을 갱신하고
			필요한 동의 절차를 마련하겠습니다.
			<a href="https://policies.google.com/technologies/partner-sites?hl=ko"
				>Google의 파트너 사이트 데이터 이용 안내</a
			>를 참고하세요.
		</p>

		<h3>문의와 방침 변경</h3>
		<p>
			문의는
			<a href="https://github.com/hjh3311504/hjh3311504.github.io/issues/new?template=feedback.yml"
				>GitHub 제보 창구</a
			>로 받습니다. 작성한 내용과 계정명은 공개될 수 있으므로 참가자의 실제 명단이나 민감한 정보를
			게시하지 마세요. 문의 내용은 답변과 문제 해결에 사용합니다. 방침이 바뀌면 이 내용과 적용일을
			갱신합니다.
		</p>
	</div>
</Dialog>

<style>
	:global(.privacy-trigger) {
		min-height: auto;
		padding: 0;
		color: inherit;
		font-size: inherit;
		font-weight: inherit;
		line-height: inherit;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	:global(.privacy-trigger:hover) {
		color: inherit;
		background: transparent;
	}

	:global(.privacy-dialog[open]) {
		display: flex;
		flex-direction: column;
		position: fixed;
		inset: 0;
		width: min(680px, calc(100vw - 32px));
		max-height: min(760px, calc(100vh - 32px));
		padding: 0;
		margin: auto;
		overflow: hidden;
	}

	:global(.privacy-dialog::backdrop) {
		background: rgb(20 24 32 / 52%);
	}

	:global(.privacy-dialog .ui-dialog-header) {
		flex: 0 0 auto;
		padding: 24px 24px 18px;
		border-bottom: 1px solid var(--ui-border);
	}

	:global(.privacy-dialog .dialog-close[data-close-dialog]) {
		height: 36px;
		color: var(--ui-text-muted);
		background: transparent;
		border-color: transparent;
	}

	:global(.privacy-dialog .dialog-close[data-close-dialog]:not(:disabled):hover) {
		color: var(--ui-danger);
		background: var(--ui-danger-soft);
		border-color: var(--ui-danger-border);
	}

	:global(.privacy-dialog .ui-dialog-header h2),
	:global(.privacy-dialog .ui-dialog-header p),
	.privacy-content h3,
	.privacy-content p {
		margin: 0;
	}

	:global(.privacy-dialog .ui-dialog-header h2) {
		font-size: 22px;
	}

	:global(.privacy-dialog .ui-dialog-header p) {
		margin-top: 6px;
		color: var(--ui-text-muted);
		font-size: 14px;
	}

	.privacy-content {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 22px 24px;
		overflow-y: auto;
		scrollbar-gutter: stable;
	}

	.privacy-content h3 {
		margin-top: 10px;
		font-size: 16px;
	}

	.privacy-content h3:first-child {
		margin-top: 0;
	}

	.privacy-content p {
		color: var(--ui-text-muted);
		font-size: 14px;
		line-height: 1.7;
		word-break: keep-all;
		overflow-wrap: anywhere;
	}

	.privacy-content a {
		color: var(--ui-text);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	@media (max-width: 520px) {
		:global(.privacy-dialog .ui-dialog-header),
		.privacy-content {
			padding-right: 18px;
			padding-left: 18px;
		}
	}
</style>
