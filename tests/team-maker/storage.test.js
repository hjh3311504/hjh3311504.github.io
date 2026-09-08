import assert from 'node:assert/strict';
import test from 'node:test';
import { createStorage, defaultState, STORAGE_KEY } from '../../src/lib/team-maker/storage.js';

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

test('손상된 JSON과 저장소 접근 오류를 알리고 기본값으로 시작한다', () => {
	const storage = memoryStorage('{broken');
	assert.deepEqual(storage.loadState(), defaultState());
	assert.equal(storage.failures.length, 1);
	assert.equal(storage.saved(), '{broken');
	let failures = 0;
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
