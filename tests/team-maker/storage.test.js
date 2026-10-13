import assert from 'node:assert/strict';
import test from 'node:test';
import {
	BACKUP_KEY,
	createStorage,
	defaultState,
	STORAGE_KEY
} from '../../src/lib/team-maker/storage.js';

function memoryStorage(saved = null) {
	let value = saved;
	const failures = [];
	const storage = createStorage({
		getStorage: () => ({
			getItem(key) {
				assert.equal(key, 'team-maker:v1');
				return value;
			},
			setItem(key, next) {
				assert.equal(key, STORAGE_KEY);
				value = next;
			}
		}),
		onFailure: () => failures.push(true)
	});
	return { ...storage, failures, saved: () => value };
}

test('저장 데이터가 없으면 서로 독립된 빈 상태를 만든다', () => {
	const storage = memoryStorage();
	const state = storage.loadState();
	assert.deepEqual(state, defaultState());
	state.participants.push({ id: '추가', name: '가람' });
	assert.deepEqual(storage.loadState().participants, []);
	assert.deepEqual(storage.failures, []);
});

test('손상된 JSON은 원본을 백업하고 저장소 접근 오류만 알린다', () => {
	const values = new Map([[STORAGE_KEY, '{broken']]);
	let failures = 0;
	const storage = createStorage({
		getStorage: () => ({
			getItem: (key) => values.get(key) ?? null,
			setItem: (key, value) => values.set(key, value)
		}),
		onFailure: () => failures++
	});
	assert.deepEqual(storage.loadState(), defaultState());
	assert.equal(failures, 0, '저장소는 정상이므로 저장 실패 안내를 띄우지 않는다.');
	assert.equal(values.get(BACKUP_KEY), '{broken');
	storage.saveState(defaultState());
	assert.equal(values.get(BACKUP_KEY), '{broken', '다음 저장 뒤에도 원본을 보관한다.');
	failures = 0;
	const blocked = createStorage({
		getStorage: () => {
			throw new Error('저장소 접근 차단');
		},
		onFailure: () => failures++
	});
	assert.deepEqual(blocked.loadState(), defaultState());
	assert.equal(failures, 1);
});

test('옛 참가자 열과 승리 기록을 복원하고 잘못된 항목만 정리한다', () => {
	const saved = {
		version: 1,
		participants: [
			{ id: 'p1', name: ' 가람 ', col: 0 },
			{ id: 'p2', name: '나래', col: 1, included: false },
			{ id: 'p1', name: '중복 ID' },
			{ id: 'empty', name: ' ' }
		],
		rules: [
			{ id: 'r1', type: 'together', participantIds: ['p1', 'p2', 'missing'] },
			{ id: 'r2', type: 'apart', participantIds: ['p1', 'missing'] }
		],
		rosters: [
			{ id: 'roster', name: '저장 명단', participants: [{ id: 'p3', name: '다온' }], rules: [] }
		],
		teamCount: '100',
		teamSize: '0',
		soundEnabled: false,
		history: [
			{
				id: 'h1',
				occurredAt: '2026-09-08T03:00:00.000Z',
				winnerTeamId: 1,
				teams: [
					{ id: 1, name: '1팀', members: ['가람', 123] },
					{ id: 2, name: '2팀', members: ['나래'], picks: ['나래', null] }
				]
			}
		],
		todayClearedAt: '2026-09-08T04:00:00.000Z'
	};
	const storage = memoryStorage(JSON.stringify(saved));
	const state = storage.loadState();
	assert.equal(state.version, 2);
	assert.deepEqual(
		state.participants.map(({ id, name, column, included }) => ({ id, name, column, included })),
		[
			{ id: 'p1', name: '가람', column: 0, included: true },
			{ id: 'p2', name: '나래', column: 1, included: false }
		]
	);
	assert.deepEqual(state.rules, [{ id: 'r1', type: 'together', participantIds: ['p1', 'p2'] }]);
	assert.equal(state.rosters[0].participants[0].name, '다온');
	assert.equal(state.teamCount, 20);
	assert.equal(state.teamSize, 4);
	assert.equal(state.soundEnabled, false);
	assert.deepEqual(state.history[0].ranking, [1, 2]);
	assert.deepEqual(
		state.history[0].teams.map((team) => team.picks),
		[[], ['나래']]
	);
	assert.deepEqual(state.history[0].teams[0].members, ['가람']);
	assert.equal(state.todayClearedAt, saved.todayClearedAt);
	assert.equal(storage.saveState(state), true);
	assert.deepEqual(storage.loadState(), state);
	assert.deepEqual(storage.failures, []);
});

test('저장 실패 뒤에도 현재 데이터를 유지하고 다시 저장할 수 있다', () => {
	let blocked = true;
	let value;
	let failures = 0;
	const storage = createStorage({
		getStorage: () => ({
			setItem(key, next) {
				assert.equal(key, STORAGE_KEY);
				if (blocked) throw new Error('저장 공간 부족');
				value = next;
			}
		}),
		onFailure: () => failures++
	});
	const state = defaultState();
	state.participants.push({ id: 'p1', name: '가람', included: true });
	assert.equal(storage.saveState(state), false);
	assert.equal(state.participants[0].name, '가람');
	assert.equal(failures, 1);
	blocked = false;
	assert.equal(storage.saveState(state), true);
	assert.deepEqual(JSON.parse(value), state);
});

test('손상 데이터를 백업하지 못하면 원본을 지키려고 저장하지 않는다', () => {
	const values = new Map([[STORAGE_KEY, '{broken']]);
	let failures = 0;
	const storage = createStorage({
		getStorage: () => ({
			getItem: (key) => values.get(key) ?? null,
			setItem: (key, value) => {
				if (key === BACKUP_KEY) throw new Error('용량 초과');
				values.set(key, value);
			}
		}),
		onFailure: () => failures++
	});
	assert.deepEqual(storage.loadState(), defaultState());
	assert.equal(storage.saveState(defaultState()), false);
	assert.equal(values.get(STORAGE_KEY), '{broken');
	assert.equal(failures, 2);
});

test('다른 탭의 저장·삭제만 읽고 다른 키와 저장소는 무시한다', () => {
	const area = {};
	const storage = createStorage({ getStorage: () => area });
	const saved = JSON.stringify({ ...defaultState(), soundEnabled: false });
	assert.equal(
		storage.readChange({ key: STORAGE_KEY, newValue: saved, storageArea: area }).soundEnabled,
		false
	);
	assert.deepEqual(
		storage.readChange({ key: STORAGE_KEY, newValue: null, storageArea: area }),
		defaultState()
	);
	assert.deepEqual(
		storage.readChange({ key: null, newValue: null, storageArea: area }),
		defaultState()
	);
	assert.equal(storage.readChange({ key: 'other', newValue: saved, storageArea: area }), null);
	assert.equal(storage.readChange({ key: STORAGE_KEY, newValue: saved, storageArea: {} }), null);
	assert.equal(
		storage.readChange({ key: STORAGE_KEY, newValue: '{broken', storageArea: area }),
		null
	);
});
