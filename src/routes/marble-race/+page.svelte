<script>
	import { onMount, untrack } from 'svelte';
	import SiteShell from '$lib/components/organisms/SiteShell.svelte';
	import ToolPageHeader from '$lib/components/organisms/ToolPageHeader.svelte';
	import ToolPageFooter from '$lib/components/organisms/ToolPageFooter.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Surface from '$lib/components/ui/Surface.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import {
		BLOCKS,
		MAPS,
		ACTIVE_BLOCK_TYPES,
		SPECIAL_TYPES,
		resolveMap,
		resolveMapId,
		parseNames
	} from '$lib/marble-race/catalog.js';
	import { createRace, raceOrder, winners, butterHitCount } from '$lib/marble-race/physics.js';
	import { FINALE_SPEED } from '$lib/marble-race/director.js';
	import { createWorkerClient } from '$lib/marble-race/worker-client.js';
	import { createRenderer } from '$lib/marble-race/renderer.js';
	import { createAudio, SOUND_FILES } from '$lib/marble-race/audio.js';
	import { createCamera } from '$lib/marble-race/camera.js';
	import {
		DEFAULT_NAMES,
		readSettings,
		createSettingsWriter,
		validateDraw
	} from '$lib/marble-race/settings.js';
	import BlockThumbnail from '$lib/marble-race/BlockThumbnail.svelte';
	import RaceMinimap from '$lib/marble-race/components/RaceMinimap.svelte';
	import StageOverlay from '$lib/marble-race/components/StageOverlay.svelte';
	import WinnerPanel from '$lib/marble-race/components/WinnerPanel.svelte';
	import VirtualList from '$lib/marble-race/components/VirtualList.svelte';
	import CustomMapEditor from '$lib/marble-race/components/CustomMapEditor.svelte';
	import './marble-race.css';
	let namesText = $state(DEFAULT_NAMES),
		mapId = $state('crunch'),
		mode = $state('first'),
		count = $state(3),
		nth = $state(1),
		soundEnabled = $state(true),
		volume = $state(45),
		customMaps = $state([]);
	let status = $state('ready'),
		speed = $state(1),
		ready = $state(false),
		message = $state(''),
		fatalError = $state(''),
		audioFailed = $state(false),
		focusId = $state('-1'),
		overview = $state(false),
		fullscreen = $state(false),
		reduced = $state(false);
	let race = $state.raw(null),
		order = $state.raw([]),
		selectedWinners = $state.raw([]),
		view = $state.raw({ top: 0, bottom: 680, left: 0, right: 720, scale: 1 }),
		cinematic = $state.raw(null),
		elapsed = $state(0),
		arrived = $state(0),
		progress = $state(''),
		celebrating = $state(false),
		liveAnnouncement = $state(''),
		raceModeLabel = $state(''),
		query = $state('');
	let confirmDialog = $state();
	let canvas,
		stage,
		renderer,
		audio,
		writer,
		raf = 0,
		operation = 0,
		previewTimer,
		celebrationTimer,
		workerBusy = false,
		deferredFrame = null,
		previous = 0,
		lastPhysics = 0,
		lastSync = 0,
		pendingSeconds = 0,
		confirmPrevious = 'ready';
	const client = createWorkerClient(),
		camera = createCamera();
	let parsed = $derived(parseNames(namesText));
	let busy = $derived(['running', 'paused', 'loading'].includes(status));
	let maps = $derived([...MAPS, ...customMaps]);
	let selectedMap = $derived(resolveMap(mapId, customMaps));
	let drawCount = $derived(mode === 'nth' ? nth : mode === 'multiple' ? count : 1);
	let countError = $derived(validateDraw(mode, count, nth, parsed.count));
	let modeLabel = $derived(
		mode === 'first'
			? '첫 번째 도착'
			: mode === 'last'
				? '마지막 도착'
				: mode === 'nth'
					? `${nth}번째 도착`
					: `먼저 도착한 ${count}개`
	);
	let visibleOrder = $derived(
		query.trim()
			? order.filter((m) => m.name.includes(query.trim()) || String(m.id + 1) === query.trim())
			: order
	);
	function synchronize() {
		if (!race) return;
		elapsed = race.time;
		arrived = race.finished.length;
		order = raceOrder(race).map((m, i) => ({
			...m,
			rank: i + 1,
			progress: Math.min(100, Math.max(0, (m.y / race.layout.finish.y) * 100))
		}));
		if (status !== 'finished' || !selectedWinners.length)
			selectedWinners = winners(race, mode, drawCount).map((m) => ({
				id: m.id,
				name: m.name,
				color: m.color
			}));
	}
	function draw(seconds = 0) {
		if (!race || !renderer) return;
		const bounds = canvas.getBoundingClientRect();
		view = camera.update(race, {
			width: bounds.width,
			height: bounds.height,
			seconds,
			mode,
			focusId,
			cinematic,
			reduced
		});
		audio?.setView({
			...view,
			top: view.audioTop ?? view.top,
			bottom: view.audioBottom ?? view.bottom,
			zones: race.zones
		});
		renderer.render(race, {
			focusId: cinematic?.active ? cinematic.focusId : focusId,
			overview,
			view
		});
	}
	function acceptState(state) {
		if (state.initial || !race) {
			race = {
				...state,
				identity: Symbol(),
				finished: state.finished.map((id) => state.marbles[id])
			};
		} else {
			race.time = state.time;
			race.marbles = state.marbles;
			race.blocks = state.blocks;
			race.finished = state.finished.map((id) => state.marbles[id]);
			race = { ...race };
		}
		cinematic = state.cinematic;
		if (cinematic?.finishedCelebration) speed = 1;
		if (cinematic?.newWinners?.length) {
			clearTimeout(celebrationTimer);
			celebrating = true;
			celebrationTimer = setTimeout(() => (celebrating = false), 850);
			for (const winner of cinematic.newWinners) {
				audio.celebrate?.();
				renderer.celebrate?.(race, reduced);
				liveAnnouncement = `당첨: ${winner.name}, ${winner.id + 1}번`;
			}
			synchronize();
		}
		renderer.addEvents(state.events ?? [], reduced);
		draw();
		audio.playCollisions(state.events ?? []);
		if (race.finished.length === race.marbles.length && status === 'running') {
			status = 'finished';
			synchronize();
			liveAnnouncement = `경기 종료. 당첨자 ${selectedWinners.map((m) => m.name).join(', ')}`;
		}
	}
	function frame(now) {
		const seconds = previous ? Math.min(0.08, (now - previous) / 1000) : 0;
		previous = now;
		if (status === 'running' && !workerBusy) {
			if (!audio.isReady()) {
				void pause();
				message = '소리가 멈춰 경기를 잠시 멈췄어요. 계속하기를 눌러 주세요.';
			} else {
				const delta = Math.min(0.08, (now - lastPhysics) / 1000 + pendingSeconds);
				lastPhysics = now;
				workerBusy = true;
				const current = operation;
				void client
					.advance(delta, speed)
					.then((result) => {
						if (current !== operation) return;
						pendingSeconds = result.unused ?? 0;
						if (status === 'running') acceptState(result.state);
						else if (status === 'paused' || status === 'loading') deferredFrame = result.state;
					})
					.catch((error) => {
						if (current === operation) {
							status = 'paused';
							message = error.message;
						}
					})
					.finally(() => {
						if (current === operation) workerBusy = false;
					});
			}
		}
		if (race && now - lastSync > 150) {
			synchronize();
			lastSync = now;
		}
		draw(status === 'running' ? seconds : 0);
		raf = requestAnimationFrame(frame);
	}
	function reset() {
		operation++;
		client.stop();
		workerBusy = false;
		pendingSeconds = 0;
		deferredFrame = null;
		audio?.cancelPreparation();
		status = 'ready';
		speed = 1;
		cinematic = null;
		audioFailed = false;
		clearTimeout(celebrationTimer);
		celebrating = false;
		selectedWinners = [];
		liveAnnouncement = '';
		preparePreview();
	}
	function preparePreview() {
		if (!ready || status !== 'ready') return;
		const valid = parsed.error ? parseNames(DEFAULT_NAMES) : parsed;
		const samples = [];
		for (const entry of valid.entries) {
			for (let i = 0; i < entry.count && samples.length < 60; i++) samples.push(entry.name);
			if (samples.length >= 60) break;
		}
		race = createRace(samples, selectedMap, 2026);
		for (const block of race.blocks.filter((b) => b.type === 'butter'))
			block.hp = block.maxHp = butterHitCount(valid.count);
		race.identity = Symbol();
		synchronize();
		draw();
	}
	async function start(withoutSound = false) {
		if (!ready || busy || parsed.error || countError || fatalError) return;
		const current = ++operation;
		audio.stop();
		audio.setOptions(soundEnabled, volume / 100);
		audioFailed = false;
		message = '';
		raceModeLabel = modeLabel;
		status = 'loading';
		progress = '소리와 구슬을 준비하고 있어요.';
		if (withoutSound) {
			soundEnabled = false;
			audio.setOptions(false, volume / 100);
		}
		try {
			const loaded = await audio.prepare(selectedMap.types);
			if (current !== operation) return;
			if (!loaded && soundEnabled) {
				status = 'ready';
				audioFailed = true;
				message = '소리를 준비하지 못했어요. 다시 시도하거나 소리 없이 시작해 주세요.';
				return;
			}
			const state = await client.prepare(
				{ entries: parsed.entries, count: parsed.count },
				JSON.parse(JSON.stringify(selectedMap)),
				crypto.getRandomValues(new Uint32Array(1))[0],
				mode,
				drawCount,
				(info) => {
					if (current === operation)
						progress = `구슬을 준비하고 있어요. ${info.count.toLocaleString()}개`;
				}
			);
			if (current !== operation) return;
			cinematic = null;
			speed = 1;
			workerBusy = false;
			pendingSeconds = 0;
			status = document.hidden ? 'paused' : 'running';
			acceptState(state);
			lastPhysics = performance.now();
			previous = lastPhysics;
			writer.flush();
			liveAnnouncement = `${parsed.count}개의 경기를 시작합니다. ${modeLabel} 당첨`;
		} catch (error) {
			if (current === operation) {
				status = 'ready';
				message = error.message;
			}
		}
	}
	async function pause() {
		if (status === 'running') {
			status = 'paused';
			synchronize();
			audio.stop();
			return;
		}
		if (status !== 'paused') return;
		await resume();
	}
	async function resume(withoutSound = false) {
		const current = operation;
		if (withoutSound) {
			soundEnabled = false;
			audio.setOptions(false, volume / 100);
		}
		status = 'loading';
		progress = '소리를 준비하고 있어요.';
		const loaded = await audio.prepare(selectedMap.types);
		if (current !== operation) return;
		if (!loaded && soundEnabled) {
			status = 'paused';
			audioFailed = true;
			return;
		}
		audioFailed = false;
		status = document.hidden ? 'paused' : 'running';
		if (status === 'running' && deferredFrame) {
			acceptState(deferredFrame);
			deferredFrame = null;
		}
		lastPhysics = performance.now();
		previous = lastPhysics;
	}
	function toggleSpeed() {
		if (status === 'running' && !cinematic?.active) {
			speed = speed === 1 ? 2 : 1;
			liveAnnouncement = `${speed}배속으로 전환했습니다.`;
		}
	}
	function canvasKeydown(event) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			if (!event.repeat) toggleSpeed();
		}
	}
	function requestEdit() {
		if (status === 'loading') {
			reset();
			return;
		}
		confirmPrevious = status;
		if (status === 'running') {
			status = 'paused';
			synchronize();
			audio.stop();
		}
		confirmDialog.showModal();
	}
	function cancelEdit() {
		confirmDialog.close();
		if (confirmPrevious === 'running') void resume();
	}
	function confirmEdit() {
		confirmDialog.close();
		reset();
		requestAnimationFrame(() => document.getElementById('race-names')?.focus());
	}
	async function toggleSound() {
		soundEnabled = !soundEnabled;
		audio.setOptions(soundEnabled, volume / 100);
		if (soundEnabled) {
			if (status === 'running') {
				status = 'paused';
				await resume();
			} else await audio.prepare(selectedMap.types);
		}
	}
	async function previewSound(type) {
		if (!ready || busy) return;
		const current = operation;
		audio.setOptions(true, volume / 100);
		if (await audio.prepare([type])) {
			if (current === operation && !busy) audio.play(type, 360, true);
		} else message = '이 소리를 준비하지 못했어요.';
	}
	async function toggleFullscreen() {
		try {
			if (document.fullscreenElement) await document.exitFullscreen();
			else if (stage.requestFullscreen) await stage.requestFullscreen();
			else message = '이 브라우저에서는 전체화면을 지원하지 않아요.';
		} catch {
			message = '전체화면을 열지 못했어요.';
		}
	}
	async function copyResult() {
		try {
			await navigator.clipboard.writeText(
				`${raceModeLabel} 당첨자\n${selectedWinners.map((m) => `${m.id + 1}번 ${m.name}`).join('\n')}\n\n전체 도착 순위\n${order.map((m) => `${m.rank}등: ${m.name} (${m.id + 1}번)`).join('\n')}`
			);
			message = '결과를 복사했어요.';
		} catch {
			message = '결과를 복사하지 못했어요.';
		}
	}
	function changeMaps(value) {
		customMaps = value;
		mapId = resolveMapId(mapId, value);
	}
	$effect(() => {
		const settings = { namesText, mapId, mode, count, nth, soundEnabled, volume };
		if (ready) writer.schedule(settings, JSON.parse(JSON.stringify(customMaps)));
	});
	$effect(() => {
		namesText;
		mapId;
		customMaps;
		mode;
		count;
		nth;
		if (ready && !busy) {
			clearTimeout(previewTimer);
			previewTimer = setTimeout(preparePreview, 200);
		}
	});
	$effect(() => {
		if (ready) audio.setOptions(soundEnabled, volume / 100);
	});
	$effect(() => {
		focusId;
		overview;
		if (ready && status !== 'running') untrack(() => draw());
	});
	onMount(() => {
		let storage;
		try {
			storage = window.localStorage;
		} catch {
			storage = {
				getItem() {
					throw new Error('저장소 접근 실패');
				},
				setItem() {
					throw new Error('저장소 접근 실패');
				}
			};
		}
		const saved = readSettings(storage);
		({ namesText, mapId, mode, count, nth, soundEnabled, volume, customMaps, message } = saved);
		writer = createSettingsWriter(storage, (value) => (message = value));
		try {
			renderer = createRenderer(canvas);
			audio = createAudio({
				onDiagnostic: (detail) => {
					if (canvas.hasAttribute('data-audio-diagnostics'))
						canvas.dispatchEvent(new CustomEvent('marble-audio', { detail }));
				}
			});
		} catch {
			fatalError = '경기 화면을 준비하지 못했어요. 최신 브라우저에서 다시 열어 주세요.';
			return;
		}
		const media = matchMedia('(prefers-reduced-motion: reduce)');
		reduced = media.matches;
		const onMotion = () => (reduced = media.matches);
		const onVisibility = () => {
			if (document.hidden && status === 'running') void pause();
		};
		const onFull = () => {
			fullscreen = document.fullscreenElement === stage;
			draw();
		};
		const flush = () => writer.flush();
		const resize = new ResizeObserver(() => draw());
		resize.observe(canvas);
		media.addEventListener('change', onMotion);
		document.addEventListener('visibilitychange', onVisibility);
		document.addEventListener('fullscreenchange', onFull);
		window.addEventListener('pagehide', flush);
		ready = true;
		preparePreview();
		raf = requestAnimationFrame(frame);
		return () => {
			ready = false;
			operation++;
			client.stop();
			cancelAnimationFrame(raf);
			clearTimeout(previewTimer);
			clearTimeout(celebrationTimer);
			writer.destroy();
			audio.destroy();
			resize.disconnect();
			media.removeEventListener('change', onMotion);
			document.removeEventListener('visibilitychange', onVisibility);
			document.removeEventListener('fullscreenchange', onFull);
			window.removeEventListener('pagehide', flush);
		};
	});
</script>

<svelte:head
	><title>톡톡 구슬 레이스 — 소리로 즐기는 ASMR 추첨</title><meta
		name="description"
		content="참가자 곱하기와 내 맵, 특수 장치로 즐기는 ASMR 구슬 추첨. 첫 번째·마지막·여러 명·n번째 도착을 고르세요."
	/><link rel="canonical" href="https://hjh3311504.github.io/marble-race" /></svelte:head
>
<SiteShell active="marble-race">
	<main class="marble-page">
		<ToolPageHeader
			eyebrow="소리로 즐기는 추첨"
			title="톡톡 구슬 레이스"
			description="톡, 뽁, 타닥. 나만의 소리로 추첨을 시작하세요."
		/>
		<div class="marble-layout">
			<aside class="race-settings" aria-label="경기 설정">
				{#if busy}<Surface class="settings-lock" role="status"
						><strong>경기 설정이 잠겨 있어요</strong>
						<p>경기 중에는 참가자·맵·당첨 방식을 변경할 수 없습니다.</p>
						<Button fullWidth onclick={requestEdit}
							>{status === 'loading'
								? '준비 취소하고 설정 변경'
								: '경기 종료하고 설정 변경'}</Button
						></Surface
					>{/if}
				<Surface as="section" class="race-panel"
					><div class="panel-title">
						<h2>01 참가자</h2>
						<span class="count-badge">{parsed.count.toLocaleString()}개</span>
					</div>
					<label for="race-names">참가자 이름</label><textarea
						id="race-names"
						bind:value={namesText}
						disabled={busy}
						rows="7"
						spellcheck="false"
						aria-describedby="names-help names-error"
						aria-invalid={Boolean(parsed.error)}
						placeholder="토끼*10&#10;고양이*5"></textarea>
					<p id="names-help" class="field-help">
						줄바꿈이나 쉼표로 구분 · 이름당20자<br />토끼*10 → 토끼 구슬10개 · 같은 이름도 별도 당첨
					</p>
					<p id="names-error" class="field-error">{parsed.error}</p>
					{#if parsed.count > 1000}<p class="field-help">
							구슬이 많으면 준비와 경기에 시간이 더 걸릴 수 있어요. 준비 중에도 취소할 수 있습니다.
						</p>{/if}
					<Button variant="ghost" disabled={busy} onclick={() => (namesText = DEFAULT_NAMES)}
						>예시 명단 넣기</Button
					></Surface
				>
				<Surface as="section" class="race-panel"
					><div class="panel-title"><h2>02 맵 고르기</h2></div>
					<div class="map-options">
						{#each maps as map (map.id)}<Button
								class={`map-option ${mapId === map.id ? 'selected' : ''}`}
								disabled={busy}
								aria-label={map.name}
								aria-pressed={mapId === map.id}
								onclick={() => (mapId = map.id)}
								><span
									class="map-symbol"
									style={`--map-color:${map.colors[0]};--map-second:${map.colors[1]}`}
									>{map.icon}</span
								><span><strong>{map.name}</strong><small>{map.caption}</small></span><span
									aria-hidden="true">{mapId === map.id ? '✓' : ''}</span
								></Button
							>{/each}
					</div>
					<CustomMapEditor
						maps={customMaps}
						disabled={busy}
						onchange={changeMaps}
						onselect={(id) => (mapId = id)}
					/></Surface
				>
				<Surface as="section" class="race-panel"
					><div class="panel-title"><h2>03 당첨 방식</h2></div>
					<div class="winner-options" role="group" aria-label="당첨 방식">
						{#each [['first', '첫 번째'], ['last', '마지막'], ['multiple', '여러 명'], ['nth', 'n번째']] as [value, label] (value)}<Button
								class={mode === value ? 'selected' : ''}
								aria-pressed={mode === value}
								disabled={busy}
								onclick={() => (mode = value)}>{label}</Button
							>{/each}
					</div>
					{#if mode === 'multiple'}<label class="number-field" for="winner-count"
							>당첨 인원<input
								id="winner-count"
								type="number"
								min="1"
								max={parsed.count}
								step="1"
								bind:value={count}
								disabled={busy}
								aria-invalid={Boolean(countError)}
							/>개</label
						>{/if}
					{#if mode === 'nth'}<label class="number-field" for="winner-nth"
							>당첨 순번<input
								id="winner-nth"
								type="number"
								min="1"
								max={parsed.count}
								step="1"
								bind:value={nth}
								disabled={busy}
								aria-invalid={Boolean(countError)}
							/>번째</label
						>{/if}
					<p class="field-error">{countError}</p>
					<p class="field-help">{modeLabel} 구슬이 당첨됩니다.</p></Surface
				>
				<p class="storage-note">
					명단·맵·당첨 방식·소리 설정은 바꿀 때마다 이 브라우저에 저장됩니다.
				</p>
			</aside>
			<div class="race-main">
				<section class="race-stage" bind:this={stage} aria-label="구슬 경기장">
					<div class="stage-toolbar">
						<div class="stage-title">
							<strong>{selectedMap.name}</strong><span class="stage-state"
								>{status === 'loading'
									? '소리 준비 중'
									: status === 'running'
										? '경기 중'
										: status === 'paused'
											? '잠시 멈춤'
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
							><Button aria-pressed={overview} onclick={() => (overview = !overview)}
								>{overview ? '따라가기' : '전체 맵'}</Button
							><Button
								onclick={toggleFullscreen}
								aria-label={fullscreen ? '전체화면 닫기' : '경기장 전체화면'}
								>{fullscreen ? '축소 ↙' : '전체화면 ↗'}</Button
							>
						</div>
					</div>
					{#if cinematic?.active}<p class="cinematic-note" role="status">
							당첨 확정까지{FINALE_SPEED}배속으로 진행합니다.
						</p>{/if}
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
						<RaceMinimap {race} {view} {overview} /><WinnerPanel
							winners={selectedWinners}
							{celebrating}
							{reduced}
						/>
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
						{#if status === 'loading'}<StageOverlay title="경기를 준비하고 있어요"
								><p role="status">{progress}</p>
								{#snippet actions()}<Button onclick={requestEdit}>준비 취소하고 설정 변경</Button
									>{/snippet}</StageOverlay
							>{/if}
						{#if status === 'paused'}<StageOverlay title="잠깐 쉬어 가요"
								><p>일시정지 중에도 경기 설정은 잠겨 있습니다. 변경하려면 경기를 종료해 주세요.</p>
								{#snippet actions()}<Button variant="primary" onclick={pause}>계속하기 ▶</Button
									><Button onclick={requestEdit}>경기 종료하고 설정 변경</Button
									>{/snippet}</StageOverlay
							>{/if}
						{#if status === 'finished'}<StageOverlay title="축하합니다!"
								><p>{raceModeLabel} 당첨</p>
								{#if selectedWinners.length <= 6}<div class="winner-names">
										{#each selectedWinners as winner (winner.id)}<span
												>{winner.name} <small>{winner.id + 1}번</small></span
											>{/each}
									</div>{:else}<p>
										{selectedWinners.length}개 당첨 · 목록에서 확인하세요.
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
								disabled={!ready}>{soundEnabled ? '♫ 소리 켜짐' : '♪ 소리 꺼짐'}</Button
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
							{#if busy}<Button onclick={requestEdit}
									>{status === 'loading' ? '준비 취소' : '경기 종료하고 설정 변경'}</Button
								><Button variant="primary" disabled={status === 'loading'} onclick={pause}
									>{status === 'paused' ? '계속하기 ▶' : '잠시 멈춤 Ⅱ'}</Button
								>{:else}<Button
									variant="primary"
									onclick={() => start()}
									disabled={!ready || Boolean(parsed.error || countError || fatalError)}
									>{status === 'finished' ? '다시 시작 ↻' : '구슬 굴리기 ▶'}</Button
								>{/if}
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
				<p class="race-message" role="status">{message}</p>
				{#if audioFailed}<div class="audio-recovery">
						<Button onclick={() => (status === 'paused' ? resume() : start())}
							>소리 다시 준비</Button
						><Button onclick={() => (status === 'paused' ? resume(true) : start(true))}
							>소리 없이 시작</Button
						>
					</div>{/if}
				<Surface as="section" class="race-panel"
					><div class="panel-title">
						<h2>도착 순위</h2>
						{#if status === 'finished'}<Button onclick={copyResult}>결과 복사</Button>{/if}
					</div>
					<label for="marble-search">구슬 찾기</label><input
						id="marble-search"
						type="search"
						bind:value={query}
						placeholder="이름 또는 구슬 번호"
					/>
					<Button variant="ghost" onclick={() => (focusId = '-1')}>자동으로 따라가기</Button>
					<VirtualList items={visibleOrder} height={288} rowHeight={48} label="구슬 도착 순위"
						>{#snippet children(m)}<span>{m.rank}등</span><i
								class="marble-dot"
								style:background={m.color}
							></i><Button variant="ghost" onclick={() => (focusId = String(m.id))}
								>{m.name} <small>{m.id + 1}번</small></Button
							><span>{m.finished ? '도착' : `${Math.floor(m.progress)}%`}</span
							>{/snippet}</VirtualList
					>
				</Surface>
			</div>
		</div>
		<section class="block-library" aria-labelledby="block-library-title">
			<div class="library-heading">
				<h2 id="block-library-title">블록 도감</h2>
				<p>미리듣기와 경기에서 같은 소리를 사용해요.</p>
			</div>
			<div class="block-grid">
				{#each ACTIVE_BLOCK_TYPES as type (type)}<Surface class="block-card"
						><BlockThumbnail {type} />
						<div>
							<h3>{BLOCKS[type].name}</h3>
							{#if selectedMap.layers.includes(type)}<small class="map-material"
									>선택 맵에 포함</small
								>{/if}
							<p>{BLOCKS[type].description}</p>
							{#if type === 'butter'}<p>
									이번 경기: {butterHitCount(parsed.count || 2)}회 충돌하면 부서져요.
								</p>{/if}
							<small>{BLOCKS[type].sound}</small>
						</div>
						<Button
							aria-label={`${BLOCKS[type].name} 소리 미리듣기`}
							disabled={!ready || busy}
							onclick={() => previewSound(type)}>소리 듣기 ♫</Button
						></Surface
					>{/each}
			</div>
		</section>
		<section class="block-library" aria-labelledby="special-library-title">
			<h2 id="special-library-title">특수 구간 안내</h2>
			<div class="block-grid">
				{#each SPECIAL_TYPES as type (type)}<Surface class="block-card"
						><div class="special-symbol" style:background={BLOCKS[type].color}>
							{BLOCKS[type].symbol}
						</div>
						<div>
							<h3>{BLOCKS[type].name}</h3>
							{#if selectedMap.layers.includes(type)}<small class="map-material"
									>선택 맵에 포함</small
								>{/if}
							<p>{BLOCKS[type].description}</p>
							{#if type === 'butter'}<p>
									이번 경기: {butterHitCount(parsed.count || 2)}회 충돌하면 부서져요.
								</p>{/if}
						</div>
						<Button
							disabled={!ready || busy || !SOUND_FILES[type]?.length}
							onclick={() => previewSound(type)}
							>{SOUND_FILES[type]?.length ? '소리 듣기 ♫' : '소리 선택 중'}</Button
						></Surface
					>{/each}
			</div>
			<p>경기 중에는 미리듣기가 잠깁니다. 소리·볼륨은 경기 화면에서 조절할 수 있어요.</p>
		</section>
		<ToolPageFooter />
	</main>
	<Dialog
		bind:element={confirmDialog}
		title="경기를 종료할까요?"
		titleId="stop-race-title"
		closeAction={cancelEdit}
		oncancel={(event) => {
			event.preventDefault();
			cancelEdit();
		}}
		><p>현재 경기를 이어갈 수 없습니다. 참가자와 설정은 유지됩니다.</p>
		{#snippet actions()}<Button onclick={cancelEdit}>경기로 돌아가기</Button><Button
				variant="danger"
				onclick={confirmEdit}>종료하고 설정 변경</Button
			>{/snippet}</Dialog
	>
	<div class="sr-only" aria-live="polite">{liveAnnouncement}</div>
</SiteShell>
