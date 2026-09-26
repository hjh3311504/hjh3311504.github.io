<script>
	import RaceRanking from '$lib/marble-race/components/RaceRanking.svelte';
	import RaceStage from '$lib/marble-race/components/RaceStage.svelte';
	import RaceSettings from '$lib/marble-race/components/RaceSettings.svelte';
	import { onMount, untrack, tick } from 'svelte';
	import SiteShell from '$lib/components/organisms/SiteShell.svelte';
	import ToolPageLayout from '$lib/components/organisms/ToolPageLayout.svelte';

	import ToolPageFooter from '$lib/components/organisms/ToolPageFooter.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	import {
		DEFAULT_MAP_ID,
		MAPS,
		resolveMap,
		resolveMapId,
		parseNames
	} from '$lib/marble-race/catalog.js';
	import { raceOrder, winners, butterHitCount } from '$lib/marble-race/physics.js';

	import { createWorkerClient } from '$lib/marble-race/worker-client.js';
	import { createPreviewOrder } from '$lib/marble-race/preview-order.js';
	import { pinRankingItem } from '$lib/marble-race/ranking-order.js';
	import { createPresentation } from '$lib/marble-race/presentation.js';
	import { createDrawSchedule } from '$lib/marble-race/draw-schedule.js';
	import { createRenderer } from '$lib/marble-race/renderer.js';
	import { SKILL_TYPES } from '$lib/marble-race/skills.js';
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
		mapId = $state(DEFAULT_MAP_ID),
		mode = $state('first'),
		rangeText = $state('1~3'),
		nth = $state(1),
		soundEnabled = $state(true),
		volume = $state(45),
		customMaps = $state([]);
	let status = $state('ready'),
		loadingFrom = $state('ready'),
		speed = $state(1),
		skillsEnabled = $state(true),
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
	let displayRace = $state.raw(null);
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
	let canvas = $state(),
		stage = $state();
	let renderer,
		audio,
		writer,
		raf = 0,
		operation = 0,
		previewTimer,
		celebrationTimer,
		deferredFrame = null,
		pauseRequest = Promise.resolve(),
		previous = 0,
		lastSync = 0,
		raceSeed = 2026;
	let previewOperation = 0;
	let previousRaceSettings;
	const previewClient = createWorkerClient();
	const client = createWorkerClient(receiveLiveState, handleWorkerError),
		camera = createCamera(),
		presentation = createPresentation(),
		shouldDraw = createDrawSchedule();
	let canvasBounds = { width: 0, height: 0 };
	let pendingAudioEvents = [];
	let parsed = $derived(parseNames(namesText));
	let controlStatus = $derived(status === 'loading' ? loadingFrom : status);
	let busy = $derived(['running', 'paused', 'loading'].includes(status));
	let maps = $derived([...MAPS, ...customMaps]);
	let selectedMap = $derived(resolveMap(mapId, customMaps));
	let raceSoundTypes = $derived(
		skillsEnabled ? [...selectedMap.types, ...SKILL_TYPES] : selectedMap.types
	);
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
				? '마지막 남은 구슬'
				: mode === 'nth'
					? `${nth}번째 도착`
					: range.error
						? '지정한 도착 순위'
						: `${range.start}~${range.end}번째 도착`
	);
	let previewEntries = $derived((parsed.error ? parseNames(DEFAULT_NAMES) : parsed).entries);
	let matchingOrder = $derived(
		race?.preview
			? createPreviewOrder(previewEntries, query)
			: query.trim()
				? order.filter((m) => m.name.includes(query.trim()) || String(m.id + 1) === query.trim())
				: order
	);
	let trackedMarble = $derived(
		focusId === '-1'
			? undefined
			: race?.preview
				? createPreviewOrder(previewEntries).slice(Number(focusId), Number(focusId) + 1)[0]
				: order.find((marble) => String(marble.id) === focusId)
	);
	let visibleOrder = $derived(pinRankingItem(matchingOrder, trackedMarble));
	function synchronize() {
		if (!race) return;
		// 새 미리보기가 도착하기 전 이전 경기의 당첨자를 다시 채우지 않는다.
		if (status === 'ready') {
			elapsed = arrived = 0;
			return;
		}
		elapsed = race.time;
		arrived = race.finished.length;
		if (race.preview) return;
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
		const bounds = canvasBounds;
		displayRace = presentation.sample(race, performance.now(), status === 'running');
		view = camera.update(displayRace, {
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
			zones: race.zones
		});
		renderer.render(displayRace, {
			focusId: cinematic?.active ? cinematic.focusId : focusId,
			overview,
			skillsEnabled,
			reduced,
			view,
			bounds
		});
		if (pendingAudioEvents.length) {
			audio?.playCollisions(pendingAudioEvents);
			pendingAudioEvents = [];
		}
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
			race.skillWaves = state.skillWaves;
			race.marbles = state.marbles;
			race.blocks = state.blocks;
			race.finished = state.finished.map((id) => state.marbles[id]);
			race = { ...race };
		}
		presentation.push(race, performance.now());
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
		pendingAudioEvents.push(...(state.events ?? []));
		if (race.finished.length === race.marbles.length && status === 'running') {
			status = 'finished';
			synchronize();
			liveAnnouncement = `경기 종료. 당첨자 ${selectedWinners.map((m) => m.name).join(', ')}`;
		}
	}
	function receiveLiveState(state) {
		if (status === 'running') acceptState(state);
		else if (status === 'paused' || status === 'loading') {
			// 정지 직전 전환과 효과음은 마지막 위치 상태에 합쳐 한 번만 처리한다.
			if (deferredFrame)
				state = {
					...state,
					events: [...(deferredFrame.events ?? []), ...(state.events ?? [])],
					cinematic: {
						...state.cinematic,
						newWinners: [
							...(deferredFrame.cinematic?.newWinners ?? []),
							...(state.cinematic?.newWinners ?? [])
						],
						finishedCelebration:
							deferredFrame.cinematic?.finishedCelebration || state.cinematic?.finishedCelebration
					}
				};
			deferredFrame = state;
		}
	}
	function handleWorkerError(error) {
		status = 'paused';
		message = error.message;
	}
	function frame(now) {
		raf = requestAnimationFrame(frame);
		if (status === 'running' && !audio.isReady()) {
			void pause();
			message = '소리가 멈춰 경기를 잠시 멈췄어요. 계속하기를 눌러 주세요.';
		}
		if (!shouldDraw(now, race?.marbles.length ?? 0)) return;
		const seconds = previous ? Math.min(0.08, (now - previous) / 1000) : 0;
		previous = now;
		if (race && now - lastSync > 150) {
			synchronize();
			lastSync = now;
		}
		draw(seconds);
	}
	function reset() {
		operation++;
		client.stop();
		deferredFrame = null;
		pendingAudioEvents = [];
		audio?.cancelPreparation();
		status = 'ready';
		raceSeed = crypto.getRandomValues(new Uint32Array(1))[0];
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
	function cancelPreview() {
		previewOperation++;
		previewClient.stop();
		clearTimeout(previewTimer);
	}
	async function preparePreview() {
		if (!ready || status !== 'ready') return;
		cancelPreview();
		const current = previewOperation;
		const valid = parsed.error ? parseNames(DEFAULT_NAMES) : parsed;
		try {
			const state = await previewClient.prepare(
				{ entries: valid.entries, count: valid.count },
				JSON.parse(JSON.stringify(selectedMap)),
				raceSeed,
				mode,
				drawCount,
				undefined,
				drawStart,
				false,
				true
			);
			if (current !== previewOperation || status !== 'ready' || !ready) return;
			previewClient.stop();
			race = { ...state, identity: Symbol(), finished: [] };
			cinematic = null;
			synchronize();
			draw();
		} catch (error) {
			if (current === previewOperation && ready && status === 'ready') message = error.message;
		}
	}
	function toggleSkills() {
		if (!ready || status !== 'ready') return;
		skillsEnabled = !skillsEnabled;
		liveAnnouncement = skillsEnabled
			? '스킬 사용 ON. 낮은 확률로 파동을 발사해 주변 구슬을 밀어냅니다.'
			: '스킬 사용 OFF';
	}
	function shufflePositions() {
		if (!ready || status !== 'ready' || parsed.error || fatalError) return;
		clearTimeout(previewTimer);
		raceSeed = crypto.getRandomValues(new Uint32Array(1))[0];
		preparePreview();
		liveAnnouncement = '구슬의 출발 자리를 섞었어요.';
	}

	async function start(withoutSound = false) {
		if (!ready || busy || parsed.error || countError || fatalError) return;
		cancelPreview();
		if (status === 'finished') raceSeed = crypto.getRandomValues(new Uint32Array(1))[0];
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
			const loaded = await audio.prepare(raceSoundTypes);
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
				raceSeed,
				mode,
				drawCount,
				(info) => {
					if (current === operation)
						progress = `구슬을 준비하고 있어요. ${info.count.toLocaleString()}개`;
				},
				drawStart,
				skillsEnabled
			);
			if (current !== operation) return;
			cinematic = null;
			speed = 1;
			status = document.hidden ? 'paused' : 'running';
			acceptState(state);
			previous = performance.now();
			if (status === 'running') client.run(speed);
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
			const current = operation;
			pauseRequest = client.pause().catch((error) => {
				if (current === operation) handleWorkerError(error);
			});
			pendingAudioEvents = [];
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
		const loaded = await audio.prepare(raceSoundTypes);
		await pauseRequest;
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
		previous = performance.now();
		if (status === 'running') client.run(speed);
	}
	function toggleSpeed() {
		if (status === 'running' && !cinematic?.active) {
			speed = speed === 1 ? 2 : 1;
			client.setSpeed(speed);
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
				await pause();
				await resume();
			} else await audio.prepare(raceSoundTypes);
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
			skillsEnabled,
			volume
		};
		if (ready) writer.schedule(settings, JSON.parse(JSON.stringify(customMaps)));
	});
	$effect(() => {
		// 종료 자체와 설정 편집을 구분해 결과 화면이 저절로 사라지지 않게 한다.
		const settings = JSON.stringify([namesText, selectedMap, mode, rangeText, nth]);
		const changed = previousRaceSettings !== undefined && previousRaceSettings !== settings;
		previousRaceSettings = settings;
		if (!ready || busy) return;
		if (changed && status === 'finished') untrack(reset);
		else if (status === 'ready') {
			cancelPreview();
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
		({
			namesText,
			mapId,
			mode,
			rangeText,
			nth,
			soundEnabled,
			skillsEnabled,
			volume,
			customMaps,
			message
		} = saved);
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
		const resize = new ResizeObserver(([entry]) => {
			canvasBounds = { width: entry.contentRect.width, height: entry.contentRect.height };
			draw();
		});
		canvasBounds = canvas.getBoundingClientRect();
		resize.observe(canvas);
		media.addEventListener('change', onMotion);
		document.addEventListener('visibilitychange', onVisibility);
		document.addEventListener('fullscreenchange', onFull);
		window.addEventListener('pagehide', flush);
		raceSeed = crypto.getRandomValues(new Uint32Array(1))[0];
		ready = true;
		preparePreview();
		raf = requestAnimationFrame(frame);
		return () => {
			ready = false;
			cancelPreview();
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
			<RaceSettings
				bind:namesText
				{mapId}
				bind:mode
				{rangeText}
				bind:nth
				{customMaps}
				{status}
				{parsed}
				{busy}
				{maps}
				{range}
				{countError}
				{modeLabel}
				{requestEdit}
				{setRangeBoundary}
				{selectMap}
				{changeMaps}
			/>
			<div class="race-main">
				<RaceStage
					{soundEnabled}
					bind:volume
					{status}
					{speed}
					{skillsEnabled}
					{ready}
					{copyNotice}
					{fatalError}
					bind:overview
					{fullscreen}
					{reduced}
					{race}
					{displayRace}
					{selectedWinners}
					{view}
					{cinematic}
					{elapsed}
					{arrived}
					{progress}
					{celebrating}
					{celebrationId}
					{celebrationWinners}
					{liveAnnouncement}
					{raceModeLabel}
					bind:canvas
					bind:stage
					{parsed}
					{controlStatus}
					{busy}
					{selectedMap}
					{countError}
					{modeLabel}
					{toggleSkills}
					{shufflePositions}
					{start}
					{pause}
					{toggleSpeed}
					{canvasKeydown}
					{confirmEdit}
					{toggleSound}
					{toggleFullscreen}
					{copyResult}
					{inspectMap}
					{stopInspecting}
				/>
				{#if message}<p class="race-message" role="status">{message}</p>{/if}
				{#if audioFailed}<div class="audio-recovery">
						<Button onclick={() => (status === 'paused' ? resume() : start())}
							>소리 다시 준비</Button
						><Button onclick={() => (status === 'paused' ? resume(true) : start(true))}
							>소리 없이 시작</Button
						>
					</div>{/if}
				<RaceRanking
					{status}
					{focusId}
					onselect={(id) => {
						inspectionY = null;
						focusId = focusId === String(id) ? '-1' : String(id);
					}}
					{race}
					bind:query
					{visibleOrder}
					{copyResult}
					{stopInspecting}
				/>
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
