import { createLifetime } from './lifecycle.js';

export function createAudio({ getState, $, persist }) {
	const lifetime = createLifetime();
	const { on } = lifetime;
	const state = getState();
	let audioSources = new Set();
	let audioContext = null;
	function renderSoundButton() {
		const button = $('#sound-toggle-button');
		button.setAttribute('aria-pressed', String(state.soundEnabled));
		button.setAttribute('aria-label', state.soundEnabled ? '효과음 끄기' : '효과음 켜기');
		button.title = state.soundEnabled ? '효과음 끄기' : '효과음 켜기';
		$('#sound-wave-path').setAttribute(
			'd',
			state.soundEnabled ? 'M15.5 8.5a5 5 0 0 1 0 7' : 'M22 9l-6 6M16 9l6 6'
		);
	}

	function getAudioContext() {
		if (!state.soundEnabled) return null;
		try {
			const AudioContext = window.AudioContext || window.webkitAudioContext;
			if (!AudioContext) return null;
			if (!audioContext || audioContext.state === 'closed') {
				audioContext = new AudioContext();
			}
			if (audioContext.state === 'suspended') {
				audioContext.resume().catch(() => {});
			}
			return audioContext;
		} catch {
			return null;
		}
	}

	function trackAudioSource(source) {
		audioSources.add(source);
		on(
			source,
			'ended',
			() => {
				audioSources.delete(source);
			},
			{ once: true }
		);
	}

	function stopSounds() {
		for (const source of audioSources) {
			try {
				source.stop();
			} catch {
				// 이미 끝난 효과음은 무시한다.
			}
		}
		audioSources.clear();
	}

	function playFanfare() {
		const context = getAudioContext();
		if (!context) return;
		const startTime = context.currentTime + 0.03;
		const motif = [
			{ frequency: 523.25, offset: 0, duration: 0.16 },
			{ frequency: 659.25, offset: 0.11, duration: 0.16 },
			{ frequency: 783.99, offset: 0.22, duration: 0.16 },
			{ frequency: 1046.5, offset: 0.34, duration: 0.75 }
		];

		for (const [noteIndex, note] of motif.entries()) {
			const noteStart = startTime + note.offset;
			const peak = noteIndex === motif.length - 1 ? 0.18 : 0.13;
			for (const [harmonicIndex, multiplier] of [1, 2].entries()) {
				const oscillator = context.createOscillator();
				const gain = context.createGain();
				oscillator.type = 'triangle';
				oscillator.frequency.value = note.frequency * multiplier;
				gain.gain.setValueAtTime(0.0001, noteStart);
				gain.gain.exponentialRampToValueAtTime(peak / (harmonicIndex + 1.2), noteStart + 0.015);
				gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + note.duration);
				oscillator.connect(gain).connect(context.destination);
				oscillator.start(noteStart);
				oscillator.stop(noteStart + note.duration + 0.05);
				trackAudioSource(oscillator);
			}
		}

		for (const [index, frequency] of [1046.5, 1318.51, 1567.98].entries()) {
			const oscillator = context.createOscillator();
			const gain = context.createGain();
			const chordStart = startTime + 0.34;
			oscillator.type = 'sine';
			oscillator.frequency.value = frequency;
			gain.gain.setValueAtTime(0.0001, chordStart);
			gain.gain.exponentialRampToValueAtTime(0.09 / (index + 1), chordStart + 0.03);
			gain.gain.exponentialRampToValueAtTime(0.0001, chordStart + 1.1);
			oscillator.connect(gain).connect(context.destination);
			oscillator.start(chordStart);
			oscillator.stop(chordStart + 1.2);
			trackAudioSource(oscillator);
		}

		for (const [index, frequency] of [1568, 2093, 2637].entries()) {
			const oscillator = context.createOscillator();
			const gain = context.createGain();
			const bellStart = startTime + 0.5 + index * 0.09;
			oscillator.type = 'sine';
			oscillator.frequency.value = frequency;
			gain.gain.setValueAtTime(0.0001, bellStart);
			gain.gain.exponentialRampToValueAtTime(0.05, bellStart + 0.01);
			gain.gain.exponentialRampToValueAtTime(0.0001, bellStart + 0.5);
			oscillator.connect(gain).connect(context.destination);
			oscillator.start(bellStart);
			oscillator.stop(bellStart + 0.55);
			trackAudioSource(oscillator);
		}
	}
	function connect() {
		on($('#sound-toggle-button'), 'click', () => {
			state.soundEnabled = !state.soundEnabled;
			if (state.soundEnabled) getAudioContext();
			else stopSounds();
			persist();
			renderSoundButton();
		});
	}
	function destroy() {
		stopSounds();
		void audioContext?.close().catch(() => {});
		lifetime.destroy();
	}
	return { connect, destroy, getAudioContext, stopSounds, playFanfare, renderSoundButton };
}
