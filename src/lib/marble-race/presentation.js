import { settleFinaleContacts } from './physics.js';
// 물리 상태는 그대로 두고 화면에서만 두 수신 상태 사이를 그린다.
export function createPresentation() {
	let boundary,
		identity,
		previousTime = 0,
		latestTime = 0,
		received = 0,
		duration = 0;
	let previous = [],
		latest = [],
		marbles = [];
	function positions(race) {
		return race.marbles.map((m) => ({
			x: m.x,
			y: m.y,
			finished: m.finished,
			held: m.held ? { ...m.held } : null
		}));
	}
	function capture(race) {
		return race.marbles.map((m) => ({ ...m, held: m.held ? { ...m.held } : null }));
	}
	return {
		push(race, now) {
			if (identity !== (race.identity ?? race)) {
				identity = race.identity ?? race;
				boundary = {
					layout: race.layout,
					finaleBlocks: race.blocks.filter((block) => block.zoneId === 'finale'),
					finaleIds: new Set(
						race.marbles.filter((m) => m.y + m.r >= race.layout.finale.start).map((m) => m.id)
					)
				};
				previous = latest = positions(race);
				marbles = capture(race);
				previousTime = latestTime = race.time;
				duration = 0;
				received = now;
				return;
			}
			if (race.time === latestTime) return;
			previous = latest;
			previousTime = latestTime;
			latest = positions(race);
			for (const m of race.marbles)
				if (m.y + m.r >= race.layout.finale.start) boundary.finaleIds.add(m.id);
			marbles = capture(race);
			latestTime = race.time;
			duration = Math.min(80, Math.max(8, now - received));
			received = now;
		},
		sample(race, now, running = true) {
			if ((race.identity ?? race) !== identity) return race;
			const alpha = running && duration ? Math.min(1, Math.max(0, (now - received) / duration)) : 1;
			for (let id = 0; id < latest.length; id++) {
				const a = previous[id],
					b = latest[id],
					m = marbles[id];
				m.x = b.x;
				m.y = b.y;
				if (m.held && b.held) {
					m.held.x = b.held.x;
					m.held.y = b.held.y;
				}
				// 같은 번개 정지 중 바에 밀리는 이동은 보간하고, 고정·해제 전환은 즉시 반영한다.
				const pushedWhileStunned =
					a.held?.kind === 'lightning' &&
					b.held?.kind === 'lightning' &&
					a.held.until === b.held.until;
				if (!b.finished && !a.finished && ((!b.held && !a.held) || pushedWhileStunned)) {
					m.x = a.x + (b.x - a.x) * alpha;
					m.y = a.y + (b.y - a.y) * alpha;
				}
			}
			const time = previousTime + (latestTime - previousTime) * alpha;
			if (alpha > 0 && alpha < 1) {
				boundary.time = time;
				boundary.marbles = marbles;
				settleFinaleContacts(boundary, true);
			}
			return { ...race, time, marbles };
		}
	};
}
