import test from 'node:test';
import assert from 'node:assert/strict';
import { ARENA_THEMES } from '../../src/lib/marble-race/arena-theme.js';

function luminance(hex) {
	const [r, g, b] = [1, 3, 5].map((index) => {
		const value = parseInt(hex.slice(index, index + 2), 16) / 255;
		return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
	const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (high + 0.05) / (low + 0.05);
}

for (const [name, palette] of Object.entries(ARENA_THEMES)) {
	test(`${name} 경기장의 글자는 4.5:1, 길을 알려 주는 그래픽은 3:1 이상이다`, () => {
		const pairs = [
			['text', 'background', 4.5],
			['labelText', 'labelBackground', 4.5],
			['focusLabelText', 'labelBackground', 4.5],
			...['wall', 'arc', 'finaleWall', 'finaleRotor', 'finishLine', 'frozenRing', 'focusRing'].map(
				(key) => [key, 'background', 3]
			),
			...['finaleWall', 'finaleRotor'].map((key) => [key, 'minimapBackground', 3])
		];
		for (const [color, background, minimum] of pairs) {
			const ratio = contrast(palette[color], palette[background]);
			assert.ok(
				ratio >= minimum,
				`${name}.${color}(${palette[color]}) / ${background}(${palette[background]}) = ${ratio.toFixed(2)}`
			);
		}
	});
}
