import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createTheme() {
	let currentTheme = 'auto';
	if (browser) {
		try {
			currentTheme = localStorage.getItem('theme-preference') || currentTheme;
		} catch {
			// 저장 공간을 사용할 수 없어도 기본 테마를 유지한다.
		}
	}

	const { subscribe, set } = writable(currentTheme);

	return {
		subscribe,
		/** @param {string} value */
		set: (value) => {
			if (browser) {
				try {
					localStorage.setItem('theme-preference', value);
				} catch {
					// 저장에 실패해도 현재 화면의 테마는 바꾼다.
				}
				document.firstElementChild?.setAttribute('data-theme', value);
			}
			set(value);
		}
	};
}

export const theme = createTheme();
