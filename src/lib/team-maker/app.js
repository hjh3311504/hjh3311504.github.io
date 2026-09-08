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
		getAudioContext: (...args) => audio.getAudioContext(...args),
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
	render();
	let destroyed = false;
	return () => {
		if (destroyed) return;
		destroyed = true;
		for (const feature of [...features].reverse()) feature.destroy();
	};
}
