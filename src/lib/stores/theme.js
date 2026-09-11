import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const themeKey = 'juno.develog.theme';
const choices = new Set(['auto', 'light', 'dark']);

/** @param {unknown} value */
const normalize = (value) => (choices.has(value) ? value : 'auto');

function readPreference() {
	if (!browser) return 'auto';
	try {
		return normalize(localStorage.getItem(themeKey));
	} catch {
		return 'auto';
	}
}

const preference = writable(readPreference());

export const theme = {
	subscribe: preference.subscribe,
	/** @param {string} value */
	set(value) {
		const selected = normalize(value);
		if (browser) {
			document.documentElement.dataset.theme = selected;
			try {
				localStorage.setItem(themeKey, selected);
			} catch {
				// 저장이 차단되어도 현재 화면에서는 선택을 적용한다.
			}
		}
		preference.set(selected);
	}
};
