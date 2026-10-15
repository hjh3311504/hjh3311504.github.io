// 경기장 Canvas·미니맵이 사이트 테마에 맞춰 같은 색을 사용한다.
// Worker에는 이름만 보내고 각 그리기 쪽에서 색을 찾는다.
// 벽·결승·도착선·얼음 표식은 배경과 3:1, 이름표 글자는 4.5:1 이상의 대비를 유지한다.
export const ARENA_THEMES = {
	light: {
		background: '#f4f8fb',
		rail: '#cbd8e2',
		text: '#5b6b80',
		finishLine: '#2b9a80',
		labelBackground: '#ffffff',
		labelBorder: '#d8e1e8',
		labelText: '#334155',
		focusLabelText: '#1e293b',
		focusRing: '#4a83e8',
		wall: '#7a8a97',
		arc: '#7a8a97',
		finaleWall: '#7a8a97',
		finaleRotor: '#d4635a',
		frozenRing: '#3f93b8',
		ripple: '#5fb7cf',
		minimapBackground: '#e9f0f5'
	},
	dark: {
		background: '#28333e',
		rail: '#52616d',
		text: '#c2cdd6',
		finishLine: '#6ac9b2',
		labelBackground: '#e9eff3',
		labelBorder: '#e9eff3',
		labelText: '#26323d',
		focusLabelText: '#111a22',
		focusRing: '#9abcf7',
		wall: '#6f808d',
		arc: '#7d8e9b',
		finaleWall: '#aabac5',
		finaleRotor: '#ee9b8e',
		frozenRing: '#e4faff',
		ripple: '#e7fffc',
		minimapBackground: '#1f2932'
	}
};

export const arenaPalette = (theme) => ARENA_THEMES[theme] ?? ARENA_THEMES.light;

// 사이트 테마 선택이 auto면 운영체제 설정을 따른다.
export function resolveArenaTheme(root = document.documentElement, media = globalThis.matchMedia) {
	const selected = root.dataset.theme;
	if (selected === 'light' || selected === 'dark') return selected;
	return media?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// 테마 버튼과 운영체제 설정 변화를 함께 감시한다. 반환 함수로 해제한다.
export function watchArenaTheme(onChange) {
	const root = document.documentElement;
	const media = matchMedia('(prefers-color-scheme: dark)');
	const update = () => onChange(resolveArenaTheme(root));
	const observer = new MutationObserver(update);
	observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
	media.addEventListener('change', update);
	update();
	return () => {
		observer.disconnect();
		media.removeEventListener('change', update);
	};
}
