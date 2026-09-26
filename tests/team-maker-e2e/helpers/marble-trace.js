import { gzipSync } from 'node:zlib';

// 일반 성능 검사는 그대로 두고 실패한 환경에서만 브라우저 작업 기록을 남긴다.
export async function startMarbleTrace(cdp) {
	const events = [];
	const collect = ({ value }) => events.push(...value);
	cdp.on('Tracing.dataCollected', collect);
	await cdp.send('Tracing.start', {
		categories:
			'devtools.timeline,toplevel,v8,disabled-by-default-v8.cpu_profiler,disabled-by-default-devtools.timeline.frame',
		transferMode: 'ReportEvents'
	});
	return async (testInfo) => {
		const finished = new Promise((resolve) => cdp.once('Tracing.tracingComplete', resolve));
		await cdp.send('Tracing.end');
		await finished;
		cdp.off('Tracing.dataCollected', collect);
		await testInfo.attach('marble-timeline.json.gz', {
			body: gzipSync(JSON.stringify({ traceEvents: events })),
			contentType: 'application/gzip'
		});
	};
}
