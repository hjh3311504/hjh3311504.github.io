import test from 'node:test';
import assert from 'node:assert/strict';
import {
	readSettings,
	createSettingsWriter,
	SETTINGS_KEY
} from '../../src/lib/marble-race/settings.js';

test('미니맵은 처음 방문·이전 설정·잘못된 값에서 OFF로 시작한다', () => {
	for (const value of [undefined, null, 'true', 'false', 0, 1]) {
		const settings = readSettings({
			getItem: (key) =>
				key === SETTINGS_KEY
					? JSON.stringify({ namesText: '보존*10', minimapEnabled: value })
					: null
		});
		assert.equal(settings.minimapEnabled, false);
		assert.equal(settings.namesText, '보존*10');
	}
	assert.equal(readSettings({ getItem: () => null }).minimapEnabled, false);
	assert.equal(readSettings({ getItem: () => '{' }).minimapEnabled, false);
	assert.equal(
		readSettings({
			getItem() {
				throw new Error('저장소 접근 실패');
			}
		}).minimapEnabled,
		false
	);
});

test('미니맵 ON/OFF를 기존 설정에 저장하고 다른 설정과 함께 복원한다', () => {
	const values = new Map();
	const storage = {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => values.set(key, value)
	};
	const writer = createSettingsWriter(storage, assert.fail);
	for (const minimapEnabled of [true, false]) {
		writer.schedule(
			{ ...readSettings(storage), namesText: '보존*10', volume: 27, minimapEnabled },
			[]
		);
		writer.flush();
		const loaded = readSettings(storage);
		assert.equal(loaded.minimapEnabled, minimapEnabled);
		assert.equal(loaded.namesText, '보존*10');
		assert.equal(loaded.volume, 27);
	}
	writer.destroy();
});
