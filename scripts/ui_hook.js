import { fileURLToPath } from 'node:url';
import { runHook } from './ui/hook.js';

let input = '';
for await (const chunk of process.stdin) input += chunk;
let event = {};
try {
	event = JSON.parse(input || '{}');
	const result = await runHook(fileURLToPath(new URL('../', import.meta.url)), event);
	if (result.hookSpecificOutput) process.stdout.write(JSON.stringify(result));
} catch (error) {
	// 검사 실패를 정상 통과로 숨기지 않는다.
	process.stdout.write(
		JSON.stringify({
			hookSpecificOutput: {
				hookEventName: event.hook_event_name ?? 'PostToolUse',
				additionalContext: `UI 검사가 실행되지 않았습니다: ${error.message}\nnpm ci 뒤 npm run check:ui를 실행하고 원인을 해결하세요.`
			}
		})
	);
}
