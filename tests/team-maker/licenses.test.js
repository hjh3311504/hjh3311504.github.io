import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publishedLicenses } from '../../scripts/licenses.js';

const root = fileURLToPath(new URL('../../', import.meta.url));

test('배포 라이선스 경로는 실제 파일명의 대소문자와 일치한다', async () => {
	const errors = [];
	for (const [source] of publishedLicenses) {
		let directory = root;
		for (const part of source.split('/')) {
			const entries = await readdir(directory);
			if (!entries.includes(part)) {
				errors.push(
					`${source}: ${path.relative(root, directory) || '.'}에 정확한 이름 ${part} 없음`
				);
				break;
			}
			directory = path.join(directory, part);
		}
		if (directory === path.join(root, source)) {
			assert.ok((await stat(directory)).isFile(), `${source}는 파일이어야 합니다.`);
		}
	}
	assert.deepEqual(errors, [], 'macOS와 Linux에서 같은 라이선스 원문을 찾아야 합니다.');
});
