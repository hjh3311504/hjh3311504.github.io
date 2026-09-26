import test from 'node:test';
import assert from 'node:assert/strict';
import { paintMarbleIcon } from '../../src/lib/marble-race/icon-painter.js';

function surface() {
	const document = {
		fonts: { status: 'loaded' },
		created: 0,
		createElement() {
			this.created++;
			return canvas();
		}
	};
	function canvas() {
		const result = { ownerDocument: document };
		const context = {
			font: '',
			scale() {},
			translate() {},
			measureText: (text) => ({ width: text.length * 8 }),
			createRadialGradient: () => ({ addColorStop() {} }),
			beginPath() {},
			arc() {},
			fill() {},
			fillText(text) {
				result.number = text;
			},
			drawImage(image) {
				result.image = image;
			}
		};
		result.getContext = () => context;
		return result;
	}
	return { document, canvas };
}

test('다시 만든 카드도 번호·색·배율이 같으면 같은 그림을 쓴다', () => {
	const { document, canvas } = surface();
	const first = canvas(),
		second = canvas();
	paintMarbleIcon(first, 999, '#abc', 2);
	paintMarbleIcon(second, 999, '#abc', 2);
	assert.equal(document.created, 1);
	assert.equal(first.image, second.image);
	assert.equal(second.image.number, '1000');
	assert.equal(second.width, 72);
	for (const [id, color, quality] of [
		[998, '#abc', 2],
		[999, '#def', 2],
		[999, '#abc', 1]
	]) {
		paintMarbleIcon(second, id, color, quality);
		assert.notEqual(first.image, second.image);
	}
});

test('글꼴 로딩 상태가 바뀌면 그림을 다시 만들고 문서별로 구분한다', () => {
	const { document, canvas } = surface();
	const target = canvas();
	document.fonts.status = 'loading';
	paintMarbleIcon(target, 1, '#abc', 1);
	const loading = target.image;
	document.fonts.status = 'loaded';
	paintMarbleIcon(target, 1, '#abc', 1);
	assert.notEqual(loading, target.image);
	const another = surface().canvas();
	paintMarbleIcon(another, 1, '#abc', 1);
	assert.notEqual(target.image, another.image);
});

test('그림은256개까지 보관하고 최근 사용한 번호를 유지한다', () => {
	const { canvas } = surface();
	const target = canvas();
	paintMarbleIcon(target, 0, '#abc', 1);
	const first = target.image;
	for (let id = 1; id < 256; id++) paintMarbleIcon(target, id, '#abc', 1);
	paintMarbleIcon(target, 0, '#abc', 1);
	paintMarbleIcon(target, 256, '#abc', 1);
	paintMarbleIcon(target, 0, '#abc', 1);
	assert.equal(target.image, first);
	for (let id = 257; id < 513; id++) paintMarbleIcon(target, id, '#abc', 1);
	paintMarbleIcon(target, 0, '#abc', 1);
	assert.notEqual(target.image, first);
});
