import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

async function listCssFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const file = path.join(directory, entry.name);
			if (entry.isDirectory()) return listCssFiles(file);
			return entry.isFile() && entry.name.endsWith('.css') ? [file] : [];
		})
	);
	return files.flat().sort();
}

export async function verifyTeamMakerCss(root) {
	const files = [
		path.join(root, 'src/routes/team-maker/team-maker.css'),
		...(await listCssFiles(path.join(root, 'src/lib/team-maker/styles')))
	];
	const violations = [];
	for (const file of files) {
		const css = await readFile(file, 'utf8');
		const sizes = [...css.matchAll(/font-size:\s*(\d+)px/g)]
			.map((match) => Number(match[1]))
			.filter((size) => size % 2 !== 0);
		if (sizes.length)
			violations.push(
				`${path.relative(root, file)}: ${sizes.map((size) => `${size}px`).join(', ')}`
			);
	}
	if (violations.length)
		throw new Error(`team-maker CSS에 홀수 글자 크기가 있습니다:\n${violations.join('\n')}`);
}
