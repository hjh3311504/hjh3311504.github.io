import { createLifetime } from './lifecycle.js';
import { createStorage } from './storage.js';
import { createUi } from './ui.js';
import { createParticipants } from './participants.js';
import { createResults } from './results.js';
import { createDialogs } from './dialogs.js';
import { createRosters } from './rosters.js';
import { createHistory } from './history.js';
import { createWheel } from './wheel.js';
import { createAudio } from './audio.js';

export function mountTeamMaker(root) {
	if (!root) throw new Error('Team Maker를 연결할 요소가 없습니다.');
	const $ = (selector) => root.querySelector(selector);
	const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const assetUrl = (name) => `${root.dataset.assetsBase}/${name}`;
	let storageFailed = false;
	const storage = createStorage({
		onFailure: () => {
			storageFailed = true;
			showStorageFailure();
		}
	});
	const state = storage.loadState();
	const getState = () => state;
	const runtime = {
		teams: [],
		resultMessage: '',
		ranking: [],
		lastHistoryId: null,
		picks: {},
		wheelTeamId: null,
		wheelSpinning: false,
		animateTeams: false,
		animateWinner: false
	};

	function showStorageFailure() {
		$('#storage-alert').hidden = !storageFailed;
	}
	function persist() {
		storage.saveState(state);
	}
	function saveAndRender({ clearTeams = true } = {}) {
		if (clearTeams) results.clearResult();
		persist();
		render();
	}
	// 다른 탭의 저장을 같은 상태 객체에 반영해, 이 탭이 오래된 상태로 덮어쓰지 않게 합니다.
	function syncFromOtherTab(event) {
		const next = storage.readChange(event);
		if (!next) return;
		const setupChanged = ['participants', 'rules', 'mode', 'teamCount', 'teamSize'].some(
			(key) => JSON.stringify(state[key]) !== JSON.stringify(next[key])
		);
		Object.assign(state, next);
		const resultEntryRemoved =
			runtime.lastHistoryId && !state.history.some((entry) => entry.id === runtime.lastHistoryId);
		// 돌림판이 도는 중에는 결과를 지우지 않고 다음 변경 때 정리합니다.
		if ((setupChanged || resultEntryRemoved) && !runtime.wheelSpinning) {
			dialogs.closeDialog($('#wheel-dialog'));
			results.clearResult();
		}
		render();
		audio.renderSoundButton();
		if ($('#history-dialog').open) history.renderHistoryDialog();
	}
	function render() {
		showStorageFailure();
		participants.renderParticipants();
		participants.renderRules();
		participants.renderSettings();
		results.renderResults();
		history.renderTodayHistory();
	}
	// 다른 기능의 동작은 이 연결 지점에서만 전달합니다.
	const ui = createUi({
		root,
		prefersReducedMotion
	});
	const participants = createParticipants({
		getState,
		root,
		$,
		createRemoveButton: (...args) => ui.createRemoveButton(...args),
		markEntering: (...args) => ui.markEntering(...args),
		saveAndRender,
		showDialog: (...args) => dialogs.showDialog(...args),
		closeDialog: (...args) => dialogs.closeDialog(...args),
		captureFlipPositions: (...args) => ui.captureFlipPositions(...args),
		playFlip: (...args) => ui.playFlip(...args),
		showConfirm: (...args) => dialogs.showConfirm(...args)
	});
	const results = createResults({
		getState,
		runtime,
		$,
		applyUiButton: (...args) => ui.applyUiButton(...args),
		createRemoveButton: (...args) => ui.createRemoveButton(...args),
		currentSetup: (...args) => participants.currentSetup(...args),
		root,
		undoRank: (...args) => history.undoRank(...args),
		recordRank: (...args) => history.recordRank(...args),
		renameTeam: (...args) => history.renameTeam(...args),
		openWheel: (...args) => wheel.openWheel(...args)
	});
	const dialogs = createDialogs({
		root,
		runtime,
		$
	});
	const rosters = createRosters({
		getState,
		$,
		applyUiButton: (...args) => ui.applyUiButton(...args),
		createRemoveButton: (...args) => ui.createRemoveButton(...args),
		persist,
		closeDialog: (...args) => dialogs.closeDialog(...args),
		saveAndRender,
		showDialog: (...args) => dialogs.showDialog(...args),
		showConfirm: (...args) => dialogs.showConfirm(...args)
	});
	const history = createHistory({
		getState,
		runtime,
		$,
		createRemoveButton: (...args) => ui.createRemoveButton(...args),
		currentTeamIds: (...args) => results.currentTeamIds(...args),
		markEntering: (...args) => ui.markEntering(...args),
		persist,
		rankOf: (...args) => results.rankOf(...args),
		renderResults: (...args) => results.renderResults(...args),
		closeDialog: (...args) => dialogs.closeDialog(...args),
		showConfirm: (...args) => dialogs.showConfirm(...args),
		captureFlipPositions: (...args) => ui.captureFlipPositions(...args),
		playFlip: (...args) => ui.playFlip(...args),
		assetUrl,
		root,
		showDialog: (...args) => dialogs.showDialog(...args)
	});
	const wheel = createWheel({
		runtime,
		$,
		root,
		stopSounds: (...args) => audio.stopSounds(...args),
		syncPicksToHistory: (...args) => history.syncPicksToHistory(...args),
		assetUrl,
		rankOf: (...args) => results.rankOf(...args),
		prepareWheelSound: (...args) => audio.prepareWheelSound(...args),
		playWheelSpin: (...args) => audio.playWheelSpin(...args),
		remainingMembers: (...args) => results.remainingMembers(...args),
		renderSoundButton: (...args) => audio.renderSoundButton(...args),
		showDialog: (...args) => dialogs.showDialog(...args),
		prefersReducedMotion,
		playFanfare: (...args) => audio.playFanfare(...args)
	});
	const audio = createAudio({
		getState,
		$,
		persist
	});
	const features = [ui, participants, results, dialogs, rosters, history, wheel, audio];
	for (const feature of features) feature.connect();
	const lifetime = createLifetime();
	lifetime.on(window, 'storage', syncFromOtherTab);
	render();
	let destroyed = false;
	return () => {
		if (destroyed) return;
		destroyed = true;
		lifetime.destroy();
		for (const feature of [...features].reverse()) feature.destroy();
	};
}
