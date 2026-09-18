import test from 'node:test';
import assert from 'node:assert/strict';
import {
	readSettings,
	createSettingsWriter,
	SETTINGS_KEY
} from '../../src/lib/marble-race/settings.js';

test('처음 방문과 이전 설정은 스킬 ON이며 저장한 불리언 값만 복원한다', () => {
	for (const value of [
		null,
		{},
		{ skillsEnabled: 'false' },
		{ skillsEnabled: 0 },
		{ skillsEnabled: null }
	]) {
		const settings = readSettings({
			getItem: (key) => (key === SETTINGS_KEY ? JSON.stringify(value) : null)
		});
		assert.equal(settings.skillsEnabled, true);
	}
	for (const skillsEnabled of [true, false]) {
		const values = new Map();
		const storage = {
			getItem: (key) => values.get(key) ?? null,
			setItem: (key, value) => values.set(key, value)
		};
		const writer = createSettingsWriter(storage, assert.fail);
		writer.schedule({ ...readSettings(storage), namesText: '보존*10', skillsEnabled }, []);
		writer.flush();
		const loaded = readSettings(storage);
		assert.equal(loaded.skillsEnabled, skillsEnabled);
		assert.equal(loaded.namesText, '보존*10');
		writer.destroy();
	}
});
