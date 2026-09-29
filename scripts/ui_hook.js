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
				additionalContext: `UI 검사가 실행되지 않았습니다: ${error.message}\n원인을 해결한 뒤 관련 UI 검사를 다시 실행하세요. 의존성 누락이 확인된 경우에만 패키지를 설치하세요.`
			}
		})
	);
}
