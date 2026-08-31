import { readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const imageRoot = path.resolve('build/images');

async function listImages(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await listImages(entryPath)));
		else if (/\.(?:jpe?g|png)$/i.test(entry.name)) files.push(entryPath);
	}
	return files;
}

const images = await listImages(imageRoot);
for (const sourcePath of images) {
	const extension = path.extname(sourcePath).toLowerCase();
	const outputBase = sourcePath.slice(0, -extension.length);
	if (extension !== '.png') await sharp(sourcePath).png().toFile(`${outputBase}.png`);
	await sharp(sourcePath).webp({ quality: 82 }).toFile(`${outputBase}.webp`);
	await sharp(sourcePath).avif({ quality: 52 }).toFile(`${outputBase}.avif`);
}

console.log(`이미지 최적화 완료: 원본 ${images.length}개`);
