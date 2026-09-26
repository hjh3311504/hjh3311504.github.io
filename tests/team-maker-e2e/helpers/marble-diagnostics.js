import ts from 'typescript';

// build 파일을 고치지 않고 검사 브라우저가 받는 응답에만 시간을 기록한다.
// 함수 이름은 압축되므로 의미가 보존되는 문자열·객체 속성으로 위치를 찾는다.
export function instrumentMarbleCode(source) {
	const file = ts.createSourceFile(
		'bundle.js',
		source,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.JS
	);
	const targets = new Map();
	const mark = (node, name) => {
		while (node && !ts.isFunctionLike(node)) node = node.parent;
		if (node?.body && ts.isBlock(node.body)) {
			if (name === 'render' && !node.getText(file).includes('getBoundingClientRect')) return;
			targets.set(node.body, name);
		}
	};
	function visit(node) {
		if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
			if (node.text === '물리 계산 간격은 1/60초 이하여야 합니다.') mark(node, 'physics');
			if (node.text === '경기 준비 정보가 없어요.') mark(node, 'decode');
			if (node.text === '출발') mark(node, 'render');
		}
		if (
			(ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node)) &&
			node.name.getText(file) === 'blockChanges'
		)
			mark(node, 'encode');
		if (ts.isMethodDeclaration(node) && node.name.getText(file) === 'sample')
			mark(node, 'presentation');
		ts.forEachChild(node, visit);
	}
	visit(file);
	const edits = [];
	for (const [body, name] of targets) {
		edits.push([body.getStart(file) + 1, 'const __profileBegin=performance.now();try{']);
		edits.push([
			body.end - 1,
			`}finally{globalThis.__recordMarbleCost?.(${JSON.stringify(name)},performance.now()-__profileBegin);}`
		]);
	}
	for (const [position, insertion] of edits.sort((a, b) => b[0] - a[0]))
		source = source.slice(0, position) + insertion + source.slice(position);
	return { source, stages: [...targets.values()] };
}

function workerProbe() {
	let started = 0,
		sent = 0,
		kind,
		costs = {};
	globalThis.__recordMarbleCost = (name, ms) => {
		const value = (costs[name] ??= { count: 0, ms: 0 });
		value.count++;
		value.ms += ms;
	};
	self.addEventListener('message', ({ data }) => {
		started = performance.timeOrigin + performance.now();
		sent = data.__profileSent;
		kind = data.kind;
		costs = {};
	});
	const post = self.postMessage.bind(self);
	self.postMessage = (data, ...args) => {
		if (kind === 'advance' && ['frame', 'advanced', 'idle'].includes(data.kind)) {
			const completed = performance.timeOrigin + performance.now();
			data.__profile = { started, completed, sent, costs };
		}
		return post(data, ...args);
	};
}

export async function installMarbleDiagnostics(page) {
	const stages = new Set();
	await page.route('**/_app/immutable/**/*.js', async (route) => {
		const response = await route.fetch();
		const result = instrumentMarbleCode(await response.text());
		for (const stage of result.stages) stages.add(stage);
		const worker = /\/race-worker-[^/]+\.js$/.test(new URL(route.request().url()).pathname);
		await route.fulfill({
			response,
			body: (worker ? `(${workerProbe.toString()})();\n` : '') + result.source
		});
	});
	await page.addInitScript(() => {
		window.__marbleCosts = {};
		window.__recordMarbleCost = (name, ms) => {
			const value = (window.__marbleCosts[name] ??= { count: 0, ms: 0, maximumMs: 0 });
			value.count++;
			value.ms += ms;
			value.maximumMs = Math.max(value.maximumMs, ms);
		};
		const NativeWorker = window.Worker;
		window.Worker = class extends NativeWorker {
			constructor(...args) {
				super(...args);
				this.lastReceived = 0;
				this.addEventListener('message', ({ data }) => {
					const p = data.__profile;
					if (!p) return;
					this.lastReceived = performance.now();
					const received = performance.timeOrigin + this.lastReceived;
					const record = window.__recordMarbleCost;
					record('workerRequest', p.completed - p.started);
					record('inputQueue', p.started - p.sent);
					record('outputQueue', received - p.completed);
					record('roundTrip', received - p.sent);
					for (const [name, value] of Object.entries(p.costs)) {
						// 개별 단계의 평균·개수와 요청당 전체 계산을 구분한다.
						const current = (window.__marbleCosts[name] ??= { count: 0, ms: 0 });
						current.count += value.count;
						current.ms += value.ms;
					}
				});
			}
			postMessage(data, ...args) {
				if (data.kind === 'advance') {
					const now = performance.now();
					if (this.lastReceived)
						window.__recordMarbleCost('nextRequestWait', now - this.lastReceived);
					data = { ...data, __profileSent: performance.timeOrigin + now };
				}
				return super.postMessage(data, ...args);
			}
		};
		const raf = window.requestAnimationFrame;
		window.requestAnimationFrame = (callback) =>
			raf.call(window, (now) => {
				const began = performance.now();
				try {
					callback(now);
				} finally {
					window.__recordMarbleCost('animationCallback', performance.now() - began);
				}
			});
	});
	return () => [...stages].sort();
}
