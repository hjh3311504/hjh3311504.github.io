<script>
	import WinnerCelebration from '$lib/marble-race/components/WinnerCelebration.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { FINALE_SPEED } from '$lib/marble-race/director.js';
	import RaceMinimap from '$lib/marble-race/components/RaceMinimap.svelte';
	import StageOverlay from '$lib/marble-race/components/StageOverlay.svelte';
	import WinnerPanel from '$lib/marble-race/components/WinnerPanel.svelte';
	let {
		soundEnabled,
		volume = $bindable(),
		status,
		speed,
		skillsEnabled,
		ready,
		copyNotice,
		fatalError,
		overview = $bindable(),
		fullscreen,
		reduced,
		race,
		selectedWinners,
		view,
		cinematic,
		elapsed,
		arrived,
		progress,
		celebrating,
		celebrationId,
		celebrationWinners,
		liveAnnouncement,
		raceModeLabel,
		canvas = $bindable(),
		stage = $bindable(),
		parsed,
		controlStatus,
		busy,
		selectedMap,
		countError,
		modeLabel,
		toggleSkills,
		shufflePositions,
		start,
		pause,
		toggleSpeed,
		canvasKeydown,
		confirmEdit,
		toggleSound,
		toggleFullscreen,
		copyResult,
		inspectMap,
		stopInspecting
	} = $props();
</script>

<section class="race-stage" bind:this={stage} aria-label="구슬 경기장">
	<Toast notification={copyNotice} />
	<div class="sr-only" aria-live="polite" aria-atomic="true" data-race-announcement>
		{liveAnnouncement}
	</div>
	<div class="stage-toolbar">
		<div class="stage-title">
			<strong>{selectedMap.name}</strong><span class="stage-state" role="status"
				>{status === 'loading'
					? progress
					: status === 'running'
						? '경기 중'
						: status === 'paused'
							? '일시정지'
							: status === 'finished'
								? '경기 종료'
								: '출발 준비'}</span
			>
		</div>
		<div class="stage-actions">
			<Button
				class="speed-toggle"
				aria-label="경기 배속 전환"
				aria-pressed={speed === 2}
				disabled={status !== 'running' || cinematic?.active}
				onclick={toggleSpeed}>{cinematic?.active ? FINALE_SPEED : speed}배속</Button
			><Button
				onclick={shufflePositions}
				disabled={!ready || status !== 'ready' || Boolean(parsed.error || fatalError)}
				>자리섞기</Button
			><Button
				class="skill-toggle"
				aria-label="스킬 사용"
				aria-pressed={skillsEnabled}
				title={status === 'ready'
					? '낮은 확률로 원형 파동을 발사해 주변 구슬을 밀어냅니다.'
					: '경기를 종료하고 출발 준비 화면에서 변경해 주세요.'}
				disabled={!ready || status !== 'ready'}
				onclick={toggleSkills}
				>스킬 사용 <span class="skill-toggle-state">{skillsEnabled ? 'ON' : 'OFF'}</span></Button
			><Button aria-pressed={overview} onclick={() => (overview = !overview)}
				>{overview ? '따라가기' : '전체 맵'}</Button
			><Button
				onclick={toggleFullscreen}
				aria-label={fullscreen ? '전체화면 닫기' : '경기장 전체화면'}
				>{fullscreen ? '축소 ↙' : '전체화면 ↗'}</Button
			>
		</div>
	</div>
	<div class="canvas-wrap">
		<canvas
			bind:this={canvas}
			role="button"
			tabindex="0"
			aria-pressed={speed === 2}
			aria-disabled={status !== 'running' || Boolean(cinematic?.active)}
			onclick={toggleSpeed}
			onkeydown={canvasKeydown}
			aria-label={`구슬 경기 화면. 현재 ${cinematic?.active ? FINALE_SPEED : speed}배속. 클릭하거나 Enter·Space를 누르면 배속을 전환합니다.`}
		></canvas>
		{#if celebrating}{#key celebrationId}<WinnerCelebration
					winners={celebrationWinners}
					{reduced}
				/>{/key}{/if}
		<RaceMinimap
			{race}
			{view}
			{overview}
			oninspect={inspectMap}
			onleave={stopInspecting}
		/><WinnerPanel winners={selectedWinners} {celebrating} {reduced} />
		{#if status === 'ready'}<StageOverlay title="누가 당첨될까요?"
				><p>{parsed.count.toLocaleString()}개의 구슬 · {modeLabel}</p>
				{#if parsed.count > 60}<p>
						준비 화면은 구슬 일부만 표시합니다.
					</p>{/if}{#snippet actions()}<Button
						variant="primary"
						size="lg"
						onclick={() => start()}
						disabled={!ready || Boolean(parsed.error || countError || fatalError)}
						>구슬 굴리기 ▶</Button
					>{/snippet}</StageOverlay
			>{/if}
		{#if status === 'paused'}<StageOverlay title="일시정지" titleId="pause-race-title"
				><p>계속 진행하거나, 경기를 종료하고 설정을 바꿀 수 있어요.</p>
				<p>종료하면 현재 경기를 이어갈 수 없어요.<br />참가자와 설정은 유지됩니다.</p>
				{#snippet actions()}<Button id="resume-race" variant="primary" onclick={pause}
						>계속하기 ▶</Button
					><Button variant="danger" onclick={confirmEdit}>종료하고 설정 변경</Button
					>{/snippet}</StageOverlay
			>{/if}
		{#if status === 'finished'}<StageOverlay title="축하합니다!"
				><p>{raceModeLabel} 당첨</p>
				{#if selectedWinners.length <= 6}<div class="winner-names">
						{#each selectedWinners as winner (winner.id)}<span
								>{winner.name} <small>{winner.id + 1}번</small></span
							>{/each}
					</div>{:else}<p>
						{selectedWinners.length}명 당첨 · 목록에서 확인하세요.
					</p>{/if}{#snippet actions()}<Button variant="primary" onclick={() => start()}
						>한 번 더 굴리기 ↻</Button
					><Button onclick={copyResult}>결과 복사</Button>{/snippet}</StageOverlay
			>{/if}
		{#if fatalError}<StageOverlay title={fatalError} />{/if}
	</div>
	<div class="race-controls">
		<div class="sound-controls">
			<Button
				class="sound-toggle"
				aria-pressed={soundEnabled}
				onclick={toggleSound}
				disabled={!ready}
				><span class="sound-toggle-icon">{soundEnabled ? '♫' : '♪'}</span>
				<span class="sound-toggle-label">소리 {soundEnabled ? '켜짐' : '꺼짐'}</span></Button
			><label for="race-volume" class="sr-only">소리 크기</label><input
				id="race-volume"
				type="range"
				min="0"
				max="100"
				bind:value={volume}
				aria-valuetext={`${volume}%`}
			/>
		</div>
		<div class="play-controls">
			<Button
				variant="primary"
				aria-busy={status === 'loading'}
				aria-disabled={status === 'loading'}
				disabled={!ready || (!busy && Boolean(parsed.error || countError || fatalError))}
				onclick={() => {
					if (status === 'loading') return;
					if (status === 'running' || status === 'paused') pause();
					else start();
				}}
				>{controlStatus === 'paused'
					? '계속하기 ▶'
					: controlStatus === 'running'
						? '일시정지 Ⅱ'
						: controlStatus === 'finished'
							? '다시 시작 ↻'
							: '구슬 굴리기 ▶'}</Button
			>
		</div>
	</div>
	<div class="race-stats">
		<span
			>{arrived} / {busy || status === 'finished' ? race?.marbles.length : parsed.count} 도착</span
		><span
			>{Math.floor(elapsed / 60)
				.toString()
				.padStart(2, '0')}:{Math.floor(elapsed % 60)
				.toString()
				.padStart(2, '0')}</span
		>
	</div>
</section>
