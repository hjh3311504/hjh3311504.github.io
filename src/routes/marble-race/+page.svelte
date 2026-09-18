<script>
	import { onMount, untrack, tick } from 'svelte';
	import SiteShell from '$lib/components/organisms/SiteShell.svelte';
	import ToolPageLayout from '$lib/components/organisms/ToolPageLayout.svelte';
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import WinnerCelebration from '$lib/marble-race/components/WinnerCelebration.svelte';
	import ToolPageFooter from '$lib/components/organisms/ToolPageFooter.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Surface from '$lib/components/ui/Surface.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { MAPS, resolveMap, resolveMapId, parseNames } from '$lib/marble-race/catalog.js';
	import { createRace, raceOrder, winners, butterHitCount } from '$lib/marble-race/physics.js';
	import { FINALE_SPEED } from '$lib/marble-race/director.js';
	import { createWorkerClient } from '$lib/marble-race/worker-client.js';
	import { createRenderer } from '$lib/marble-race/renderer.js';
	import { createAudio } from '$lib/marble-race/audio.js';
	import { createCamera } from '$lib/marble-race/camera.js';
	import {
		DEFAULT_NAMES,
		readSettings,
		createSettingsWriter,
		validateDraw,
		parseDrawRange
	} from '$lib/marble-race/settings.js';
	import BlockLibrary from '$lib/marble-race/components/BlockLibrary.svelte';
	import RaceMinimap from '$lib/marble-race/components/RaceMinimap.svelte';
	import StageOverlay from '$lib/marble-race/components/StageOverlay.svelte';
	import WinnerPanel from '$lib/marble-race/components/WinnerPanel.svelte';
	import RankingGrid from '$lib/marble-race/components/RankingGrid.svelte';
	import CustomMapEditor from '$lib/marble-race/components/CustomMapEditor.svelte';
	import RaceGuide from '$lib/marble-race/components/RaceGuide.svelte';
	import {
		pageName,
		seoTitle,
		seoDescription,
		pageUrl,
		shareImage,
		shareImageAlt,
		structuredDataScript
	} from '$lib/marble-race/page-content.js';
	import './marble-race.css';
	let namesText = $state(DEFAULT_NAMES),
		mapId = $state('crunch'),
		mode = $state('first'),
		rangeText = $state('1~3'),
		nth = $state(1),
		soundEnabled = $state(true),
		volume = $state(45),
		customMaps = $state([]);
	let status = $state('ready'),
		loadingFrom = $state('ready'),
		speed = $state(1),
		ready = $state(false),
		message = $state(''),
		copyNotice = $state(null),
		fatalError = $state(''),
		audioFailed = $state(false),
		focusId = $state('-1'),
		overview = $state(false),
		inspectionY = $state(null),
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
		celebrationId = $state(0),
		celebrationWinners = $state.raw([]),
		liveAnnouncement = $state(''),
		raceModeLabel = $state(''),
		query = $state('');
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
		pendingSeconds = 0;
	const client = createWorkerClient(),
		camera = createCamera();
	let parsed = $derived(parseNames(namesText));
	let controlStatus = $derived(status === 'loading' ? loadingFrom : status);
	let busy = $derived(['running', 'paused', 'loading'].includes(status));
	let maps = $derived([...MAPS, ...customMaps]);
	let selectedMap = $derived(resolveMap(mapId, customMaps));
	let range = $derived(parseDrawRange(rangeText, parsed.count));
	let drawStart = $derived(mode === 'multiple' ? range.start : 1);
	let drawCount = $derived(mode === 'nth' ? nth : mode === 'multiple' ? range.count : 1);
	let countError = $derived(
		mode === 'multiple'
			? range.error || validateDraw(mode, range.count, nth, parsed.count, drawStart)
			: validateDraw(mode, 1, nth, parsed.count)
	);
	let modeLabel = $derived(
		mode === 'first'
			? '첫번째 도착'
			: mode === 'last'
				? '마지막 도착'
				: mode === 'nth'
					? `${nth}번째 도착`
					: range.error
						? '지정한 도착 순위'
						: `${range.start}~${range.end}번째 도착`
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
			selectedWinners = winners(race, mode, drawCount, drawStart).map((m) => ({
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
			inspectionY,
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
		const focusChanged = state.cinematic?.active && state.cinematic.focusId !== cinematic?.focusId;
		cinematic = state.cinematic;
		if (cinematic?.newWinners?.length) {
			clearTimeout(celebrationTimer);
			celebrating = true;
			celebrationId++;
			celebrationWinners = cinematic.newWinners;
			celebrationTimer = setTimeout(() => (celebrating = false), 2200);
			for (const winner of cinematic.newWinners) {
				audio.celebrate?.();
				liveAnnouncement = `당첨: ${winner.name}, ${winner.id + 1}번`;
			}
		}
		if (focusChanged || cinematic?.newWinners?.length) synchronize();
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
		draw(seconds);
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
		inspectionY = null;
		focusId = '-1';
		overview = false;
		query = '';
		message = '';
		copyNotice = null;
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
		race = createRace(samples, selectedMap, 2026, { layoutCount: valid.count, preview: true });
		for (const block of race.blocks.filter((b) => b.type === 'butter'))
			block.hp = block.maxHp = butterHitCount(valid.count);
		race.identity = Symbol();
		synchronize();
		draw();
	}
	async function start(withoutSound = false) {
		if (!ready || busy || parsed.error || countError || fatalError) return;
		clearTimeout(celebrationTimer);
		celebrating = false;
		celebrationWinners = [];
		const current = ++operation;
		audio.stop();
		audio.setOptions(soundEnabled, volume / 100);
		audioFailed = false;
		message = '';
		copyNotice = null;
		raceModeLabel = modeLabel;
		loadingFrom = status;
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
				},
				drawStart
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
			liveAnnouncement = `${parsed.count}개의 구슬로 경기를 시작합니다. 당첨 기준은 ${modeLabel}입니다.`;
		} catch (error) {
			if (current === operation) {
				status = 'ready';
				message = error.message;
			}
		}
	}
	async function focusPausePanel() {
		await tick();
		if (status !== 'paused' || document.hidden) return;
		const button = document.getElementById('resume-race');
		button?.focus({ preventScroll: true });
		button?.scrollIntoView({ block: 'nearest', behavior: reduced ? 'instant' : 'smooth' });
	}
	async function pause() {
		if (status === 'running') {
			status = 'paused';
			clearTimeout(celebrationTimer);
			celebrating = false;
			synchronize();
			audio.stop();
			await focusPausePanel();
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
		loadingFrom = status;
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
	async function requestEdit() {
		if (status === 'loading') {
			reset();
			return;
		}
		if (status === 'running') await pause();
		else if (status === 'paused') await focusPausePanel();
	}
	async function confirmEdit() {
		reset();
		if (document.fullscreenElement === stage) {
			try {
				await document.exitFullscreen();
			} catch {
				message = '전체화면을 닫으면 경기 설정을 변경할 수 있어요.';
			}
		}
		await tick();
		document.getElementById('race-names')?.focus();
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
		const current = operation;
		try {
			await navigator.clipboard.writeText(
				`${raceModeLabel} 당첨자\n${selectedWinners.map((m) => `${m.id + 1}번 ${m.name}`).join('\n')}\n\n전체 도착 순위\n${order.map((m) => `${m.rank}등: ${m.name} (${m.id + 1}번)`).join('\n')}`
			);
			if (current === operation) copyNotice = { message: '결과를 복사했어요.' };
		} catch {
			if (current === operation) copyNotice = { message: '결과를 복사하지 못했어요.' };
		}
	}
	function setRangeBoundary(index, value) {
		const parts = rangeText.split('~');
		parts[index] = value;
		rangeText = `${parts[0] ?? ''}~${parts[1] ?? ''}`;
	}
	function selectMap(id) {
		if (busy || mapId === id) return;
		mapId = id;
		if (status === 'finished') reset();
		else preparePreview();
	}
	function inspectMap(y) {
		inspectionY = y;
		overview = false;
	}
	function stopInspecting() {
		inspectionY = null;
		focusId = '-1';
	}
	function changeMaps(value) {
		const before = JSON.stringify(selectedMap);
		customMaps = value;
		mapId = resolveMapId(mapId, value);
		if (status === 'finished' && before !== JSON.stringify(resolveMap(mapId, value))) reset();
	}
	$effect(() => {
		const settings = {
			namesText,
			mapId,
			mode,
			count: range.count,
			rangeText,
			nth,
			soundEnabled,
			volume
		};
		if (ready) writer.schedule(settings, JSON.parse(JSON.stringify(customMaps)));
	});
	$effect(() => {
		namesText;
		mapId;
		customMaps;
		mode;
		rangeText;
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
		({ namesText, mapId, mode, rangeText, nth, soundEnabled, volume, customMaps, message } = saved);
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

<svelte:head>
	<title>{seoTitle}</title>
	<meta name="description" content={seoDescription} />
	<meta name="author" content="Lake" />
	<meta name="application-name" content={pageName} />
	<meta
		name="robots"
		content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
	/>
	<link rel="canonical" href={pageUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="ko_KR" />
	<meta property="og:site_name" content="Lake's develog" />
	<meta property="og:title" content={seoTitle} />
	<meta property="og:description" content={seoDescription} />
	<meta property="og:url" content={pageUrl} />
	<meta property="og:image" content={shareImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:alt" content={shareImageAlt} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seoTitle} />
	<meta name="twitter:description" content={seoDescription} />
	<meta name="twitter:image" content={shareImage} />
	<meta name="twitter:image:alt" content={shareImageAlt} />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html structuredDataScript}
</svelte:head>
<SiteShell active="marble-race">
	<ToolPageLayout
		class="marble-page"
		maxWidth="1550px"
		title={pageName}
		description="이름을 넣고 소리로 즐기는 무료 구슬 추첨기. 수업 발표자부터 방송 이벤트 당첨자까지 뽑아 보세요."
	>
		<div class="marble-layout">
			<aside class="race-settings" aria-label="경기 설정">
				{#if busy}<Surface variant="card" class="settings-lock" role="status"
						><strong>경기 설정이 잠겨 있어요</strong>
						<p>경기 중에는 참가자·맵·당첨 방식을 변경할 수 없습니다.</p>
						<Button fullWidth onclick={requestEdit}
							>{status === 'loading'
								? '준비 취소하고 설정 변경'
								: '경기 종료하고 설정 변경'}</Button
						></Surface
					>{/if}
				<Surface variant="card" as="section" class="race-panel"
					><SectionHeader class="panel-title" title="참가자" step={1}>
						{#snippet meta()}<span class="count-badge">{parsed.count.toLocaleString()}개</span
							>{/snippet}
					</SectionHeader>
					<label for="race-names">참가자 이름</label><textarea
						id="race-names"
						class="ui-field"
						bind:value={namesText}
						disabled={busy}
						rows="7"
						spellcheck="false"
						aria-describedby="names-help names-error"
						aria-invalid={Boolean(parsed.error)}
						placeholder="토끼*10&#10;고양이*5"></textarea>
					<p id="names-help" class="field-help">토끼*10처럼 입력하면 같은 구슬을 여러 개 넣어요.</p>
					<p id="names-error" class="field-error">{parsed.error}</p>
					{#if parsed.count > 1000}<p class="field-help">
							구슬이 많으면 준비와 경기에 시간이 더 걸릴 수 있어요. 준비 중에도 취소할 수 있습니다.
						</p>{/if}
				</Surface>
				<Surface variant="card" as="section" class="race-panel"
					><SectionHeader class="panel-title" title="맵 고르기" step={2} />
					<div class="map-options">
						{#each maps as map (map.id)}<Button
								class={`map-option ${mapId === map.id ? 'selected' : ''}`}
								disabled={busy}
								aria-label={map.name}
								aria-pressed={mapId === map.id}
								onclick={() => selectMap(map.id)}
								title={map.name}
								><span
									class="map-symbol"
									style={`--map-color:${map.colors[0]};--map-second:${map.colors[1]}`}
									>{map.icon}</span
								><span class="map-name"><strong>{map.name}</strong></span><span aria-hidden="true"
									>{mapId === map.id ? '✓' : ''}</span
								></Button
							>{/each}
					</div>
					<CustomMapEditor
						maps={customMaps}
						disabled={busy}
						onchange={changeMaps}
						onselect={selectMap}
					/></Surface
				>
				<Surface variant="card" as="section" class="race-panel"
					><SectionHeader class="panel-title" title="당첨 방식" step={3} />
					<div class="winner-options" role="group" aria-label="당첨 방식">
						{#each [['first', '첫번째'], ['last', '마지막'], ['multiple', '여러명'], ['nth', 'n번째']] as [value, label] (value)}<Button
								class={mode === value ? 'selected' : ''}
								aria-pressed={mode === value}
								disabled={busy}
								onclick={() => (mode = value)}>{label}</Button
							>{/each}
					</div>
					{#if mode === 'multiple' || mode === 'nth'}
						<fieldset class="winner-settings" disabled={busy}>
							<legend>{mode === 'multiple' ? '당첨 순위 범위' : '당첨 순번'}</legend>
							<div class="winner-settings-inputs" class:is-range={mode === 'multiple'}>
								{#if mode === 'multiple'}<label class="sr-only" for="winner-range-start"
										>시작 순위</label
									>
									<input
										id="winner-range-start"
										class="ui-field"
										type="number"
										inputmode="numeric"
										min="1"
										max={parsed.count}
										step="1"
										value={rangeText.split('~')[0]?.trim() ?? ''}
										oninput={(event) => setRangeBoundary(0, event.currentTarget.value)}
										aria-invalid={Boolean(countError)}
										aria-describedby="winner-input-help winner-error"
									/>
									<span aria-hidden="true">~</span>
									<label class="sr-only" for="winner-range-end">끝 순위</label>
									<input
										id="winner-range-end"
										class="ui-field"
										type="number"
										inputmode="numeric"
										min="1"
										max={parsed.count}
										step="1"
										value={rangeText.split('~')[1]?.trim() ?? ''}
										oninput={(event) => setRangeBoundary(1, event.currentTarget.value)}
										aria-invalid={Boolean(countError)}
										aria-describedby="winner-input-help winner-error"
									/>
								{:else}
									<label class="sr-only" for="winner-nth">당첨 순번</label>
									<input
										id="winner-nth"
										class="ui-field"
										type="number"
										inputmode="numeric"
										min="1"
										max={parsed.count}
										step="1"
										bind:value={nth}
										aria-invalid={Boolean(countError)}
										aria-describedby="winner-input-help winner-error"
									/>
								{/if}
							</div>
						</fieldset>
						<p id="winner-input-help" class="field-help">
							{mode === 'multiple'
								? '시작4, 끝6이면4·5·6번째로 도착한 구슬이 당첨돼요.'
								: '순번4를 입력하면4번째로 도착한 구슬이 당첨돼요.'}
						</p>
					{/if}
					<p id="winner-error" class="field-error">{countError}</p>
					<p class="field-help">
						{mode === 'multiple' && !countError
							? `${range.start}~${range.end}번째로 도착한 구슬 ${range.count}개가 당첨됩니다.`
							: `${modeLabel} 구슬이 당첨됩니다.`}
					</p></Surface
				>
			</aside>
			<div class="race-main">
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
				{#if message}<p class="race-message" role="status">{message}</p>{/if}
				{#if audioFailed}<div class="audio-recovery">
						<Button onclick={() => (status === 'paused' ? resume() : start())}
							>소리 다시 준비</Button
						><Button onclick={() => (status === 'paused' ? resume(true) : start(true))}
							>소리 없이 시작</Button
						>
					</div>{/if}
				<Surface variant="card" as="section" class="race-panel"
					><div class="panel-title">
						<h2>도착 순위</h2>
						{#if status === 'finished'}<Button onclick={copyResult}>결과 복사</Button>{/if}
					</div>
					<label for="marble-search">구슬 찾기</label><input
						id="marble-search"
						class="ui-field"
						type="search"
						bind:value={query}
						placeholder="이름 또는 구슬 번호"
					/>
					<Button variant="ghost" onclick={stopInspecting}>자동으로 따라가기</Button>
					{#key race?.identity}<RankingGrid
							items={visibleOrder}
							selectedId={focusId}
							resetKey={query}
							onselect={(id) => {
								inspectionY = null;
								focusId = String(id);
							}}
						/>{/key}
				</Surface>
			</div>
		</div>
		<BlockLibrary
			selectedLayers={selectedMap.layers}
			disabled={!ready || busy}
			waxHits={butterHitCount(parsed.count || 2)}
			onpreview={previewSound}
		/>
		<RaceGuide />
		<ToolPageFooter />
	</ToolPageLayout>
</SiteShell>
