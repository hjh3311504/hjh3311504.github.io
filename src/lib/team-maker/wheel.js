import { createLifetime } from './lifecycle.js';
import {
	WHEEL_SPIN_DURATION,
	WHEEL_SPIN_EASING,
	WHEEL_SPIN_SETTLE,
	calculateWheelTargetRotation
} from './core.js';

export function createWheel({
	runtime,
	$,
	root,
	stopSounds,
	syncPicksToHistory,
	assetUrl,
	rankOf,
	getAudioContext,
	remainingMembers,
	renderSoundButton,
	showDialog,
	prefersReducedMotion,
	playFanfare
}) {
	let wheelRotation = 0;
	let pendingWheelPick = null;
	const lifetime = createLifetime();
	const { on, setTimeout, clearTimeout } = lifetime;

	let celebrationTimer = null;
	let wheelRedrawTimer = null;
	let spinTimer = null;
	const wheelColors = [
		'#f39a8f',
		'#f7bd76',
		'#ecd772',
		'#9ed48b',
		'#74c7b4',
		'#84b5ec',
		'#b39ce4',
		'#f0a3c8'
	];

	const wheelTextColors = [
		'#7a261e',
		'#6b3d0a',
		'#665b09',
		'#285d22',
		'#14574d',
		'#204e83',
		'#4e3880',
		'#70204f'
	];

	function cancelWheelSpin() {
		clearTimeout(spinTimer);
		clearTimeout(wheelRedrawTimer);
		spinTimer = null;
		wheelRedrawTimer = null;
		runtime.wheelSpinning = false;
		pendingWheelPick = null;
		$('#wheel-wrap')?.classList.remove('is-spinning');
		$('#wheel-wrap')?.classList.remove('is-quick-finish');
		$('#spin-wheel-button').disabled = false;
		for (const button of root.querySelectorAll('#wheel-dialog [data-close-dialog]')) {
			button.disabled = false;
		}
		stopSounds();
	}

	function recordPick(teamId, member) {
		if (!runtime.lastHistoryId) return;
		runtime.picks[teamId] = [
			...(runtime.picks[teamId] ?? []),
			{ id: member.id, name: member.name }
		];
		syncPicksToHistory();
	}

	function removePick(teamId, index) {
		const picks = runtime.picks[teamId];
		if (!picks || index < 0 || index >= picks.length) return;
		runtime.picks[teamId] = picks.filter((_, pickIndex) => pickIndex !== index);
		syncPicksToHistory();
		if (runtime.wheelTeamId === teamId && $('#wheel-dialog').open) openWheel(teamId);
	}

	function clearTeamPicks(teamId) {
		if (!runtime.picks[teamId]?.length) return;
		delete runtime.picks[teamId];
		syncPicksToHistory();
		if (runtime.wheelTeamId === teamId && $('#wheel-dialog').open) openWheel(teamId);
	}

	function renderWheelOutcome(result, pickNumber, pickedName) {
		const eyebrow = document.createElement('span');
		eyebrow.className = 'wheel-outcome-eyebrow';
		const icon = document.createElement('img');
		icon.className = 'wheel-outcome-icon';
		icon.src = assetUrl('confetti.png');
		icon.alt = '';
		icon.width = 19;
		icon.height = 20;
		eyebrow.append(icon, `${pickNumber}번째 당첨자`);
		const name = document.createElement('strong');
		name.className = 'wheel-outcome-name';
		name.textContent = pickedName;
		result.replaceChildren(eyebrow, name);
	}

	function openWheel(teamId) {
		const team = runtime.teams.find((item) => item.id === teamId);
		if (!team || rankOf(teamId) === null) return;
		getAudioContext();
		runtime.wheelTeamId = teamId;
		runtime.wheelSpinning = false;
		pendingWheelPick = null;
		$('#wheel-wrap').classList.remove('is-spinning', 'is-quick-finish');
		for (const button of root.querySelectorAll('#wheel-dialog [data-close-dialog]')) {
			button.disabled = false;
		}

		const picks = runtime.picks[teamId] ?? [];
		const remaining = remainingMembers(team);
		$('#wheel-title').textContent = `${team.name} 뽑기`;
		$('#wheel-description').textContent =
			picks.length > 0
				? '이미 당첨된 사람은 빼고 남은 사람 중에서 뽑습니다.'
				: '이 팀 명단 중 한 명을 무작위로 뽑습니다.';
		drawWheel(remaining);

		const pickedList = $('#wheel-picked-list');
		pickedList.replaceChildren();
		$('#wheel-side').hidden = picks.length === 0;
		$('#wheel-side-title').textContent = `누적 당첨자 ${picks.length}명`;
		$('#wheel-dialog').classList.toggle('has-picks', picks.length > 0);
		for (const [index, member] of picks.entries()) {
			const item = document.createElement('li');
			item.className = 'wheel-picked-item';
			const number = document.createElement('span');
			number.className = 'wheel-picked-number';
			number.textContent = String(index + 1);
			const name = document.createElement('strong');
			name.className = 'wheel-picked-name';
			name.textContent = member.name;
			item.append(number, name);
			if (index === picks.length - 1) {
				item.dataset.latest = 'true';
				const flag = document.createElement('span');
				flag.className = 'wheel-picked-flag';
				flag.textContent = '최근 당첨자';
				item.append(flag);
			}
			pickedList.append(item);
		}

		const result = $('#wheel-result');
		const lastPick = picks.at(-1);
		result.replaceChildren();
		if (lastPick) {
			renderWheelOutcome(result, picks.length, lastPick.name);
		} else {
			result.textContent =
				remaining.length === 0 ? '이 팀은 모두 뽑았습니다.' : '돌리기를 누르세요.';
		}
		result.dataset.picked = String(Boolean(lastPick));

		const spinButton = $('#spin-wheel-button');
		spinButton.disabled = remaining.length === 0;
		if (remaining.length === 0) spinButton.textContent = '모두 뽑음';
		else spinButton.textContent = picks.length > 0 ? '다음 당첨자 뽑기' : '돌리기';
		$('#clear-picks-button').hidden = picks.length === 0;
		renderSoundButton();
		showDialog($('#wheel-dialog'), '#spin-wheel-button');
	}

	function drawWheel(members) {
		const wheel = $('#wheel');
		const count = Math.max(1, members.length);
		const gradient = members
			.map((_, index) => {
				const start = (index / count) * 100;
				const end = ((index + 1) / count) * 100;
				return `${wheelColors[index % wheelColors.length]} ${start}% ${end}%`;
			})
			.join(', ');
		wheel.style.setProperty(
			'--wheel-gradient',
			members.length > 0 ? `conic-gradient(${gradient})` : 'var(--surface-soft)'
		);
		wheel.replaceChildren();
		for (const [index, member] of members.entries()) {
			const label = document.createElement('span');
			const angle = (index * 360) / count + 180 / count;
			label.className = 'wheel-label';
			label.textContent = member.name;
			label.style.color = wheelTextColors[index % wheelTextColors.length];
			label.dataset.angle = String(angle);
			label.style.setProperty('--label-angle', `${angle}deg`);
			label.style.setProperty('--label-counter-angle', `${-(angle + wheelRotation)}deg`);
			wheel.append(label);
		}
		wheel.style.transform = `rotate(${wheelRotation}deg)`;
	}

	function celebrate() {
		if (prefersReducedMotion()) return;
		const layer = $('#celebration-layer');
		const colors = ['#6e29e7', '#ff571a', '#009f70', '#3b6fe0', '#f2a20c'];
		const particles = document.createDocumentFragment();
		for (let index = 0; index < 160; index += 1) {
			const particle = document.createElement('span');
			const angle = Math.random() * Math.PI * 2;
			const distance = 140 + Math.random() * 300;
			const size = 8 + Math.random() * 12;
			particle.className = 'celebration-particle';
			particle.style.width = `${size.toFixed(1)}px`;
			particle.style.height = `${(size * (Math.random() < 0.4 ? 1 : 0.45)).toFixed(1)}px`;
			particle.style.background = colors[index % colors.length];
			particle.style.borderRadius = Math.random() < 0.3 ? '50%' : '2px';
			particle.style.setProperty('--dx', `${(Math.cos(angle) * distance).toFixed(1)}px`);
			particle.style.setProperty('--dy', `${(Math.sin(angle) * distance + 110).toFixed(1)}px`);
			particle.style.setProperty('--rot', `${Math.round(Math.random() * 720 - 360)}deg`);
			particle.style.setProperty('--duration', `${Math.round(1100 + Math.random() * 800)}ms`);
			particle.style.setProperty('--delay', `${Math.round(Math.random() * 180)}ms`);
			particles.append(particle);
		}
		layer.replaceChildren(particles);
		layer.hidden = false;
		clearTimeout(celebrationTimer);
		celebrationTimer = setTimeout(() => {
			layer.replaceChildren();
			layer.hidden = true;
		}, 2300);
	}

	function spinWheel() {
		if (runtime.wheelSpinning) {
			finishWheelSpin({ immediate: true });
			return;
		}
		const team = runtime.teams.find((item) => item.id === runtime.wheelTeamId);
		if (!team) return;
		const candidates = remainingMembers(team);
		if (!candidates.length) return;
		const pickedIndex = Math.floor(Math.random() * candidates.length);
		const previousRotation = wheelRotation;
		const targetRotation = calculateWheelTargetRotation(
			previousRotation,
			candidates.length,
			pickedIndex
		);
		runtime.wheelSpinning = true;
		pendingWheelPick = { teamId: team.id, picked: candidates[pickedIndex] };
		const button = $('#spin-wheel-button');
		button.disabled = false;
		button.textContent = '바로 뽑기';
		for (const closeButton of root.querySelectorAll('#wheel-dialog [data-close-dialog]')) {
			closeButton.disabled = true;
		}
		const result = $('#wheel-result');
		result.textContent = '돌리는 중…';
		result.dataset.picked = 'false';
		$('#wheel-wrap').classList.add('is-spinning');
		wheelRotation = targetRotation;
		const wheel = $('#wheel');
		wheel.style.transform = `rotate(${wheelRotation}deg)`;
		for (const label of wheel.querySelectorAll('.wheel-label')) {
			const angle = Number(label.dataset.angle);
			label.style.setProperty('--label-counter-angle', `${-(angle + wheelRotation)}deg`);
		}
		stopSounds();

		clearTimeout(spinTimer);
		spinTimer = setTimeout(() => {
			finishWheelSpin();
		}, WHEEL_SPIN_DURATION + WHEEL_SPIN_SETTLE);
	}

	function finishWheelSpin({ immediate = false } = {}) {
		if (!runtime.wheelSpinning || !pendingWheelPick) return;
		clearTimeout(spinTimer);
		spinTimer = null;
		const pending = pendingWheelPick;
		pendingWheelPick = null;
		const team = runtime.teams.find((item) => item.id === pending.teamId);
		if (!team || !$('#wheel-dialog').open) {
			cancelWheelSpin();
			return;
		}
		if (immediate) {
			$('#wheel-wrap').classList.add('is-quick-finish');
			void $('#wheel').offsetWidth;
		}

		recordPick(team.id, pending.picked);
		runtime.wheelSpinning = false;
		$('#wheel-wrap').classList.remove('is-spinning');
		for (const closeButton of root.querySelectorAll('#wheel-dialog [data-close-dialog]')) {
			closeButton.disabled = false;
		}
		const stillRemaining = remainingMembers(team);
		const button = $('#spin-wheel-button');
		button.disabled = stillRemaining.length === 0;
		button.textContent = stillRemaining.length === 0 ? '모두 뽑음' : '다음 당첨자 뽑기';
		const result = $('#wheel-result');
		const picks = runtime.picks[team.id] ?? [];
		renderWheelOutcome(result, picks.length, pending.picked.name);
		result.dataset.picked = 'true';
		result.classList.remove('animate-pop');
		void result.offsetWidth;
		result.classList.add('animate-pop');
		playFanfare();
		celebrate();
		redrawWheelAfterPick(team);
	}

	function redrawWheelAfterPick(team) {
		clearTimeout(wheelRedrawTimer);
		wheelRedrawTimer = setTimeout(() => {
			wheelRedrawTimer = null;
			if (!$('#wheel-dialog').open || runtime.wheelTeamId !== team.id || runtime.wheelSpinning) {
				return;
			}
			openWheel(team.id);
		}, 1000);
	}
	function connect() {
		on($('#picked-groups'), 'click', (event) => {
			const pickButton = event.target.closest('[data-pick-remove]');
			if (pickButton) {
				removePick(Number(pickButton.dataset.pickRemove), Number(pickButton.dataset.pickIndex));
			}
		});

		on($('#clear-picks-button'), 'click', () => {
			if (runtime.wheelTeamId !== null) clearTeamPicks(runtime.wheelTeamId);
		});

		on($('#spin-wheel-button'), 'click', spinWheel);

		on($('#wheel-dialog'), 'cancel', (event) => {
			if (runtime.wheelSpinning) event.preventDefault();
		});

		on($('#wheel-dialog'), 'close', cancelWheelSpin);

		root.style.setProperty('--wheel-spin-duration', `${WHEEL_SPIN_DURATION}ms`);

		root.style.setProperty('--wheel-spin-easing', `cubic-bezier(${WHEEL_SPIN_EASING.join(', ')})`);
	}
	function destroy() {
		cancelWheelSpin();
		lifetime.destroy();
	}
	return { connect, destroy, openWheel };
}
