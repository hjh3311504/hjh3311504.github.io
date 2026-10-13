import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import * as fontkit from 'fontkit';
import { decompress } from 'wawoff2';
import { makeTeams } from '../src/lib/team-maker/core.js';

// 새 글7편의 원본 예제와 측정값. build와 분리해 측정일·원본 파일을 보존한다.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const measuredAt = new Date().toISOString();
const packageVersion = async (name) =>
	JSON.parse(await readFile(path.join(root, 'node_modules', name, 'package.json'), 'utf8')).version;
const environment = {
	measuredAt,
	node: process.version,
	sharp: sharp.versions,
	qrcode: await packageVersion('qrcode'),
	jsqr: await packageVersion('jsqr')
};
const font = fontkit
	.create(
		Buffer.from(
			await decompress(
				await readFile(path.join(root, 'src/lib/team-maker/fonts/SUIT-Variable.woff2'))
			)
		)
	)
	.getVariation({ wght: 400 });

function label(value, x, y, size = 24) {
	let cursor = x;
	const run = font.layout(value);
	return run.glyphs
		.map((glyph, index) => {
			const pos = run.positions[index];
			const scale = size / font.unitsPerEm;
			const shape = `<path fill="#183248" transform="translate(${cursor + pos.xOffset * scale},${y - pos.yOffset * scale}) scale(${scale},${-scale})" d="${glyph.path.toSVG()}"/>`;
			cursor += pos.xAdvance * scale;
			return shape;
		})
		.join('');
}

const svg = (width, height, body) =>
	Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${body}</svg>`
	);
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex');

async function save(topic, file, contents) {
	const directory = path.join(root, 'static/downloads/blog', topic);
	await mkdir(directory, { recursive: true });
	const buffer = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);
	await writeFile(path.join(directory, file), buffer);
	return { file, bytes: buffer.length, sha256: hash(buffer) };
}

async function record(topic, data) {
	await save(
		topic,
		'measurements.json',
		JSON.stringify({ ...environment, ...data }, null, 2) + '\n'
	);
}

async function figure(topic, width, height, body, parts) {
	const directory = path.join(root, 'static/images/blog', topic);
	await mkdir(directory, { recursive: true });
	await sharp(svg(width, height, `<rect width="100%" height="100%" fill="#f2f6f9"/>${body}`))
		.composite(parts)
		.png()
		.toFile(path.join(directory, 'comparison.png'));
}

// 1. 이름·내용·줄바꿈이 다른 파일의 실제 바이트와 SHA-256을 비교한다.
const original = Buffer.from('모임 시각: 19:00\n장소: 연습실A\n');
const hashInputs = [
	['original.txt', original],
	['renamed-copy.txt', Buffer.from(original)],
	['edited-time.txt', Buffer.from(original.toString().replace('19:00', '18:00'))],
	['windows-newlines.txt', Buffer.from(original.toString().replaceAll('\n', '\r\n'))]
];
const hashFiles = [];
for (const [file, buffer] of hashInputs) {
	hashFiles.push({
		...(await save('file-hash', file, buffer)),
		sameBytesAsOriginal: buffer.equals(original)
	});
}
assert.equal(hashFiles[0].sha256, hashFiles[1].sha256);
assert.equal(hashFiles[0].bytes, hashFiles[2].bytes);
assert.notEqual(hashFiles[0].sha256, hashFiles[2].sha256);
assert.notEqual(hashFiles[0].sha256, hashFiles[3].sha256);
await save(
	'file-hash',
	'SHA256SUMS.txt',
	hashFiles.map((row) => `${row.sha256}  ${row.file}\n`).join('')
);
await record('file-hash', { method: 'Node crypto SHA-256 and Buffer.equals', files: hashFiles });

// 2. 정렬 방식의 차이를 비교한다. 실제 파일 목록은 별도 브라우저 실험으로 확인한다.
const numbers = [1, 2, 3, 9, 10, 11];
const names = numbers.map((number) => `meeting-${number}.txt`);
const padded = numbers.map((number) => `meeting-${String(number).padStart(2, '0')}.txt`);
const dates = ['2026-2-09-notes.txt', '2026-10-01-notes.txt', '2026-9-30-notes.txt'];
const paddedDates = ['2026-02-09-notes.txt', '2026-10-01-notes.txt', '2026-09-30-notes.txt'];
const sorting = {
	input: names,
	paddedInput: padded,
	dateInput: dates,
	paddedDateInput: paddedDates,
	textOrder: [...names].sort(),
	numericOrder: [...names].sort(new Intl.Collator('en', { numeric: true }).compare),
	paddedTextOrder: [...padded].sort(),
	unpaddedDateOrder: [...dates].sort(),
	paddedDateOrder: [...paddedDates].sort()
};
assert.deepEqual(
	sorting.textOrder,
	[1, 10, 11, 2, 3, 9].map((number) => `meeting-${number}.txt`)
);
assert.deepEqual(sorting.numericOrder, names);
assert.deepEqual(sorting.paddedTextOrder, padded);
assert.deepEqual(sorting.paddedDateOrder, [paddedDates[0], paddedDates[2], paddedDates[1]]);
await save(
	'filename-order',
	'examples.txt',
	Object.entries(sorting)
		.map(([key, values]) => `${key}\n${values.join('\n')}\n`)
		.join('\n')
);
await record('filename-order', {
	method: 'JavaScript Array.sort and Intl.Collator en numeric',
	...sorting
});

// 3. PNG 투명 영역과 배경색을 합쳐 만든 JPG의 차이를 측정한다.
const badgeSource = svg(
	320,
	200,
	`<circle cx="105" cy="100" r="65" fill="#168c9c"/><path d="M73 101l23 23 45-50" fill="none" stroke="white" stroke-width="12"/><circle cx="218" cy="103" r="48" fill="#ee9c35" fill-opacity=".5"/>`
);
await save('png-transparency', 'badge-source.svg', badgeSource);
const transparent = await sharp(badgeSource).png().toBuffer();
const whiteJpg = await sharp(transparent)
	.flatten({ background: '#ffffff' })
	.jpeg({ quality: 90 })
	.toBuffer();
const darkJpg = await sharp(transparent)
	.flatten({ background: '#183248' })
	.jpeg({ quality: 90 })
	.toBuffer();
const backToPng = await sharp(whiteJpg).png().toBuffer();
const alphaVariants = [
	['transparent.png', transparent],
	['white-background.jpg', whiteJpg],
	['dark-background.jpg', darkJpg],
	['jpg-back-to-png.png', backToPng]
];
const alphaFiles = [];
for (const [file, buffer] of alphaVariants) {
	const { data, info } = await sharp(buffer)
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	let nonOpaquePixels = 0;
	for (let i = 3; i < data.length; i += 4) if (data[i] < 255) nonOpaquePixels++;
	alphaFiles.push({
		...(await save('png-transparency', file, buffer)),
		width: info.width,
		height: info.height,
		nonOpaquePixels,
		cornerRgba: [...data.subarray(0, 4)]
	});
}
assert.ok(alphaFiles[0].nonOpaquePixels > 0);
assert.ok(alphaFiles.slice(1).every((file) => file.nonOpaquePixels === 0));
const background = { create: { width: 344, height: 224, channels: 3, background: '#183248' } };
await figure(
	'png-transparency',
	800,
	370,
	label('같은 어두운 배경에 올린 결과', 28, 42, 28) +
		label('투명 PNG', 28, 92) +
		label('흰 배경으로 저장한 JPG', 428, 92),
	[
		{
			input: await sharp(background)
				.composite([{ input: transparent, left: 12, top: 12 }])
				.png()
				.toBuffer(),
			left: 28,
			top: 118
		},
		{
			input: await sharp(background)
				.composite([{ input: whiteJpg, left: 12, top: 12 }])
				.png()
				.toBuffer(),
			left: 428,
			top: 118
		}
	]
);
await record('png-transparency', {
	method: 'Synthetic SVG; explicit background flattening; decoded RGBA',
	files: alphaFiles
});

// 4. 옆으로 저장한 픽셀에 EXIF 방향6을 붙여 회전 처리 순서를 비교한다.
const uprightSource = svg(
	240,
	360,
	`<rect width="240" height="360" fill="#ffffff"/><rect x="16" y="16" width="208" height="50" rx="8" fill="#fbd593"/>${label('이쪽이 위', 56, 50, 28)}<path d="M120 98L65 158H96V258H144V158H175Z" fill="#168c9c"/>${label('방향 확인', 62, 316, 24)}`
);
await save('image-orientation', 'upright-source.svg', uprightSource);
const tagged = await sharp(uprightSource)
	.rotate(270)
	.withMetadata({ orientation: 6 })
	.jpeg({ quality: 95 })
	.toBuffer();
const stripped = await sharp(tagged).jpeg({ quality: 95 }).toBuffer();
const normalized = await sharp(tagged).autoOrient().jpeg({ quality: 95 }).toBuffer();
const rotationFiles = [];
for (const [file, buffer] of [
	['orientation-6.jpg', tagged],
	['orientation-removed.jpg', stripped],
	['pixels-upright.jpg', normalized]
]) {
	const meta = await sharp(buffer).metadata();
	rotationFiles.push({
		...(await save('image-orientation', file, buffer)),
		storedWidth: meta.width,
		storedHeight: meta.height,
		orientation: meta.orientation ?? null
	});
}
assert.deepEqual(
	rotationFiles.map((f) => [f.storedWidth, f.storedHeight, f.orientation]),
	[
		[360, 240, 6],
		[360, 240, null],
		[240, 360, null]
	]
);
await figure(
	'image-orientation',
	840,
	484,
	label('방향 정보 처리에 따른 차이', 28, 42, 28) +
		label('방향 정보만 제거', 28, 92) +
		label('픽셀 회전 후 저장', 502, 92),
	[
		{ input: stripped, left: 28, top: 168 },
		{ input: normalized, left: 502, top: 110 }
	]
);
await record('image-orientation', {
	method:
		'Synthetic arrow; stored pixels rotated 270 degrees; EXIF Orientation 6; sharp autoOrient',
	files: rotationFiles
});

// 5. 특수문자를 직접 이어 붙인 주소와 URLSearchParams로 만든 주소를 비교한다.
const urlInputs = [
	['기호 &를 그대로 넣음', 'https://example.invalid/join?group=R&D', 'group'],
	['기호 &를 인코딩함', 'https://example.invalid/join?group=R%26D', 'group'],
	['기호 +를 그대로 넣음', 'https://example.invalid/join?group=A+B', 'group'],
	['기호 +를 인코딩함', 'https://example.invalid/join?group=A%2BB', 'group'],
	['기호 #를 그대로 넣음', 'https://example.invalid/join?room=Room#2', 'room'],
	['기호 #를 인코딩함', 'https://example.invalid/join?room=Room%232', 'room']
];
const urlCases = urlInputs.map(([description, input, key]) => {
	const url = new URL(input);
	return {
		label: description,
		input,
		key,
		value: url.searchParams.get(key),
		fragment: url.hash,
		parameters: [...url.searchParams]
	};
});
assert.deepEqual(
	urlCases.map((row) => row.value),
	['R', 'R&D', 'A B', 'A+B', 'Room', 'Room#2']
);
const composed = new URL('https://example.invalid/join');
composed.searchParams.set('group', 'A+B');
composed.searchParams.set('room', '연습실 #2');
assert.equal(new URL(composed.href).searchParams.get('room'), '연습실 #2');
const encodedTwice = new URL('https://example.invalid/join');
encodedTwice.searchParams.set('group', 'A%2BB');
assert.equal(encodedTwice.search, '?group=A%252BB');
assert.equal(encodedTwice.searchParams.get('group'), 'A%2BB');
await save(
	'url-characters',
	'examples.txt',
	urlCases.map((row) => `${row.label}\n${row.input}\n${row.key} = ${row.value}\n`).join('\n') +
		`\nURLSearchParams로 만든 주소\n${composed.href}\n` +
		`\n이미 변환한 값을 다시 넣은 주소\n${encodedTwice.href}\ngroup = ${encodedTwice.searchParams.get('group')}\n`
);
await record('url-characters', {
	method: 'WHATWG URL and URLSearchParams in Node; no network requests',
	cases: urlCases,
	composed: composed.href,
	encodedTwice: {
		input: 'A%2BB',
		url: encodedTwice.href,
		value: encodedTwice.searchParams.get('group')
	}
});

// 6. 같은 영문 주소에 예제용 문자열을 더해 QR의 정보량·모듈 수를 비교한다.
const baseUrl = 'https://hjh3311504.github.io/qr-code';
const qrInputs = [
	baseUrl,
	`${baseUrl}?example=${'a'.repeat(80)}`,
	`${baseUrl}?example=${'a'.repeat(240)}`
];
const qrFiles = [];
const qrParts = [];
let qrLabels = label('주소 길이와 QR 칸 수', 28, 42, 28);
for (const [index, value] of qrInputs.entries()) {
	const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
	const modules = qr.modules.size;
	const buffer = await QRCode.toBuffer(value, { errorCorrectionLevel: 'M', margin: 4, scale: 6 });
	const { data, info } = await sharp(buffer)
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height);
	assert.equal(decoded?.data, value);
	qrFiles.push({
		...(await save('qr-url-length', `address-${index + 1}.png`, buffer)),
		input: value,
		utf8Bytes: Buffer.byteLength(value),
		version: qr.version,
		modules,
		width: info.width,
		margin: 4,
		scale: 6,
		moduleMmAt30mmIncludingMargin: 30 / (modules + 8),
		moduleMmAt40mmIncludingMargin: 40 / (modules + 8),
		decodedMatches: decoded.data === value
	});
	qrLabels += label(`${Buffer.byteLength(value)}바이트`, 28 + index * 310, 94);
	qrLabels += label(`${modules}×${modules}칸`, 28 + index * 310, 410);
	qrParts.push({
		input: await sharp(buffer).resize(272, 272, { kernel: 'nearest' }).toBuffer(),
		left: 28 + index * 310,
		top: 116
	});
}
assert.ok(qrFiles[0].modules < qrFiles[1].modules && qrFiles[1].modules < qrFiles[2].modules);
await figure('qr-url-length', 950, 450, qrLabels, qrParts);
await record('qr-url-length', {
	method:
		'qrcode M; 4-module margin; 6 pixels/module; jsQR decodes original pixels; 30mm sizes calculated, not printed',
	files: qrFiles
});

// 7. 실제 Team Maker 함수로 규칙 충돌과 수정 후 결과를 재현한다.
const participants = ['가람', '나래', '다온', '라온', '마루', '바다'].map((name, index) => ({
	id: index + 1,
	name
}));
const tenParticipants = [
	...participants,
	...['사라', '아라', '자람', '하람'].map((name, index) => ({ id: index + 7, name }))
];
const together = (ids) => ({ type: 'together', participantIds: ids });
const apart = (ids) => ({ type: 'apart', participantIds: ids });
const teamInputs = [
	{
		name: '이어진 같은 팀 규칙과 다른 팀 규칙 충돌',
		teamCount: 2,
		rules: [together([1, 2]), together([2, 3]), apart([1, 3])],
		expected: 'RULE_CONFLICT'
	},
	{
		name: '충돌하는 다른 팀 규칙 제거',
		teamCount: 2,
		rules: [together([1, 2]), together([2, 3])],
		expected: 'ok'
	},
	{
		name: '서로 다른 팀3명을2팀에 배정',
		teamCount: 2,
		rules: [apart([1, 2, 3])],
		expected: 'NOT_ENOUGH_TEAMS_FOR_APART_RULE'
	},
	{ name: '팀 수를3팀으로 변경', teamCount: 3, rules: [apart([1, 2, 3])], expected: 'ok' },
	{
		name: '같은 팀4명을 정원3명에 배정',
		teamCount: 2,
		rules: [together([1, 2, 3, 4])],
		expected: 'TOGETHER_GROUP_TOO_LARGE'
	},
	{
		name: '같은 팀 묶음을3명으로 수정',
		teamCount: 2,
		rules: [together([1, 2, 3])],
		expected: 'ok'
	},
	{
		name: '10명을3팀으로 나누며4명 묶음2개 지정',
		participants: tenParticipants,
		teamCount: 3,
		rules: [together([1, 2, 3, 4]), together([5, 6, 7, 8])],
		expected: 'NO_VALID_ASSIGNMENT'
	},
	{
		name: '두 번째 묶음을3명으로 수정',
		participants: tenParticipants,
		teamCount: 3,
		rules: [together([1, 2, 3, 4]), together([5, 6, 7])],
		expected: 'ok'
	}
];
const teamCases = [];
for (const input of teamInputs) {
	const caseParticipants = input.participants ?? participants;
	let result;
	try {
		const teams = makeTeams({
			participants: caseParticipants,
			rules: input.rules,
			teamCount: input.teamCount,
			random: () => 0.5
		});
		result = {
			status: 'ok',
			teams: teams.map((team) => team.members.map((member) => member.name))
		};
		const teamOf = new Map(
			teams.flatMap((team, index) => team.members.map((member) => [member.id, index]))
		);
		assert.equal(teamOf.size, caseParticipants.length);
		assert.equal(teams.flatMap((team) => team.members).length, caseParticipants.length);
		assert.ok(
			Math.max(...teams.map((team) => team.members.length)) -
				Math.min(...teams.map((team) => team.members.length)) <=
				1
		);
		for (const rule of input.rules) {
			const assigned = new Set(rule.participantIds.map((id) => teamOf.get(id)));
			assert.equal(assigned.size, rule.type === 'together' ? 1 : rule.participantIds.length);
		}
	} catch (error) {
		if (error.name !== 'AssignmentError') throw error;
		result = { status: error.code, message: error.message };
	}
	assert.equal(result.status, input.expected);
	teamCases.push({ ...input, participants: caseParticipants, result });
}
await record('team-rule-conflicts', {
	method:
		'Repository makeTeams; synthetic participants; fixed random=0.5 for reproducibility; not an odds measurement',
	cases: teamCases
});
console.log('블로그7편의 예제 생성·측정값 검증 완료');
