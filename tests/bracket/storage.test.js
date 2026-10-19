import assert from 'node:assert/strict';
import test from 'node:test';
import { createBracket, setWinner } from '../../src/lib/bracket/bracket.js';
import {
	IMPORT_KEY,
	STORAGE_KEY,
	loadState,
	saveState,
	takeImport,
	writeImport
} from '../../src/lib/bracket/storage.js';
import {
	moveTeam,
	parseBulkTeams,
	validateTeams,
	visibleLength
} from '../../src/lib/bracket/teams.js';

class MemoryStorage {
	constructor(entries = {}) {
		this.map = new Map(Object.entries(entries));
	}
	getItem(key) {
		return this.map.has(key) ? this.map.get(key) : null;
	}
	setItem(key, value) {
		this.map.set(key, String(value));
	}
	removeItem(key) {
		this.map.delete(key);
	}
}

const teams = (count) =>
	Array.from({ length: count }, (_, index) => ({
		id: `t${index + 1}`,
		name: `${index + 1}팀`,
		members: index === 0 ? ['가', '나'] : []
	}));

test('저장한 팀·설정·대진표·결과를 그대로 복원한다', () => {
	const storage = new MemoryStorage();
	let bracket = createBracket({ teams: teams(6), title: '풋살', order: 'input' });
	bracket = setWinner(bracket, 'r0m1', 't5').bracket;
	const state = { title: '풋살', order: 'input', teams: teams(6), bracket };
	saveState(storage, state);
	const loaded = loadState(storage);
	assert.equal(loaded.error, '');
	assert.deepEqual(loaded.state, state);
});

test('저장 정보가 없으면 상태 없이 시작하고 읽기 실패는 따로 알린다', () => {
	assert.deepEqual(loadState(new MemoryStorage()), { state: null, error: '' });
	const broken = {
		getItem() {
			throw new Error('blocked');
		}
	};
	assert.deepEqual(loadState(broken), { state: null, error: 'read' });
	// 저장 공간이 막혀 localStorage 자체를 꺼내지 못한 경우
	assert.deepEqual(loadState(null), { state: null, error: 'read' });
	assert.deepEqual(takeImport(null), { teams: null, error: '' });
});

test('입력 중인 빈 이름과 중복 이름도 복원해 사용자가 고칠 수 있다', () => {
	const storage = new MemoryStorage();
	const draft = [
		{ id: 'a', name: '', members: [] },
		{ id: 'b', name: '곰', members: [] },
		{ id: 'c', name: '곰', members: [] }
	];
	saveState(storage, { title: '', order: 'input', teams: draft, bracket: null });
	assert.deepEqual(loadState(storage).state.teams, draft);
});

test('손상된 저장 정보는 버리고 대진표만 손상되면 팀 목록은 살린다', () => {
	for (const raw of ['{', '{"version":9}', '{"version":1,"teams":"x"}']) {
		assert.deepEqual(loadState(new MemoryStorage({ [STORAGE_KEY]: raw })), {
			state: null,
			error: 'corrupt'
		});
	}
	const bracket = createBracket({ teams: teams(6) });
	const cases = [
		{ ...bracket, slots: bracket.slots.slice(1) },
		{ ...bracket, slots: ['t1', 't2', 't4', 't5', 't2', null, 't3', 't6'] },
		{ ...bracket, slots: [null, 't1', 't4', 't5', 't2', null, 't3', 't6'] },
		{ ...bracket, teams: bracket.teams.slice(0, 1) }
	];
	for (const broken of cases) {
		const storage = new MemoryStorage();
		saveState(storage, { title: '', order: 'input', teams: teams(6), bracket: broken });
		const loaded = loadState(storage);
		assert.equal(loaded.error, 'corrupt');
		assert.equal(loaded.state.bracket, null);
		assert.equal(loaded.state.teams.length, 6);
	}
});

test('유효하지 않은 승자 기록은 복원할 때 지운다', () => {
	const storage = new MemoryStorage();
	const bracket = {
		...createBracket({ teams: teams(4) }),
		winners: { r0m0: 't2', r1m0: 't1', x: 1 }
	};
	saveState(storage, { title: '', order: 'input', teams: teams(4), bracket });
	assert.deepEqual(loadState(storage).state.bracket.winners, {});
});

test('Team Maker에서 넘긴 팀을 한 번만 읽고 팀원 이름을 유지한다', () => {
	const storage = new MemoryStorage();
	writeImport(storage, [
		{ name: '1팀', members: ['민준', '서연'] },
		{ name: '2팀', members: ['도윤'] },
		{ name: '3팀', members: [] }
	]);
	const first = takeImport(storage);
	assert.equal(first.error, '');
	assert.deepEqual(
		first.teams.map(({ name, members }) => ({ name, members })),
		[
			{ name: '1팀', members: ['민준', '서연'] },
			{ name: '2팀', members: ['도윤'] },
			{ name: '3팀', members: [] }
		]
	);
	assert.equal(new Set(first.teams.map((team) => team.id)).size, 3, '새 id를 만든다');
	assert.equal(storage.getItem(IMPORT_KEY), null);
	assert.deepEqual(takeImport(storage), { teams: null, error: '' });
});

test('가져온 팀이 1개이거나 33개 이상이면 거절하고 키를 지운다', () => {
	for (const count of [1, 33]) {
		const storage = new MemoryStorage();
		writeImport(
			storage,
			Array.from({ length: count }, (_, index) => ({ name: `${index + 1}팀`, members: [] }))
		);
		const result = takeImport(storage);
		assert.equal(result.teams, null);
		assert.match(result.error, /2~32팀/);
		assert.equal(storage.getItem(IMPORT_KEY), null);
	}
	const storage = new MemoryStorage({ [IMPORT_KEY]: '{"version":1,"teams":[{"name":""}]}' });
	assert.equal(takeImport(storage).teams, null);
});

test('팀 이름 검증: 빈 이름·16자 초과·중복과 팀 수', () => {
	assert.equal(visibleLength('👨‍👩‍👧팀'), 2);
	const result = validateTeams([
		{ id: 'a', name: ' 곰 ' },
		{ id: 'b', name: '곰' },
		{ id: 'c', name: '  ' },
		{ id: 'd', name: '가'.repeat(17) },
		{ id: 'e', name: '👨‍👩‍👧'.repeat(16) }
	]);
	assert.deepEqual(Object.keys(result.errors).sort(), ['b', 'c', 'd']);
	assert.equal(result.valid, false);
	assert.match(validateTeams([{ id: 'a', name: '곰' }]).reason, /2개 이상/);
});

test('여러 팀 붙여넣기: 빈 칸 무시, 긴 이름·겹치는 이름·32팀 초과는 추가 전에 막는다', () => {
	assert.deepEqual(parseBulkTeams('곰\n\n 여우 \r\n'), { names: ['곰', '여우'], error: '' });
	assert.match(parseBulkTeams('가'.repeat(17)).error, /16자/);
	const thirty = Array.from({ length: 30 }, (_, index) => `팀${index}`);
	assert.match(parseBulkTeams('a\nb\nc', { existing: thirty }).error, /32개까지/);
	assert.equal(parseBulkTeams('a\nb\nc', { existing: thirty, mode: 'replace' }).error, '');
	assert.match(parseBulkTeams('\n , \n').error, /입력하세요/);
	assert.deepEqual(parseBulkTeams('곰, 여우,,늑대').names, ['곰', '여우', '늑대']);
	assert.match(parseBulkTeams('곰, 여우', { existing: [' 여우 '] }).error, /같은 이름.*여우/);
	assert.match(parseBulkTeams('곰\n곰').error, /같은 이름.*곰/);
	assert.equal(parseBulkTeams('곰', { existing: ['곰'], mode: 'replace' }).error, '');
});

test('팀 순서 옮기기: 원본은 그대로 두고 범위 밖 이동은 무시한다', () => {
	const teams = ['a', 'b', 'c', 'd'];
	assert.deepEqual(moveTeam(teams, 0, 2), ['b', 'c', 'a', 'd']);
	assert.deepEqual(moveTeam(teams, 3, 0), ['d', 'a', 'b', 'c']);
	assert.equal(moveTeam(teams, 1, -1), teams);
	assert.equal(moveTeam(teams, 1, 4), teams);
	assert.deepEqual(teams, ['a', 'b', 'c', 'd']);
});
