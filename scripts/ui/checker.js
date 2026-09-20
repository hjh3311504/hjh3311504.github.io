import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import postcss from 'postcss';
import valueParser from 'postcss-value-parser';
import { parse } from 'svelte/compiler';
import {
	tokenFiles,
	sourceExtensions,
	nativeElements,
	dynamicStyles,
	protectedSelector,
	spacingProperty,
	colorWords
} from './policy.js';

export async function listSources(root) {
	async function visit(directory) {
		const entries = await readdir(directory, { withFileTypes: true });
		const lists = await Promise.all(
			entries.map(async (entry) => {
				const file = path.join(directory, entry.name);
				if (entry.isDirectory()) return visit(file);
				return entry.isFile() && sourceExtensions.includes(path.extname(file)) ? [file] : [];
			})
		);
		return lists.flat();
	}
	return (await visit(path.join(root, 'src')))
		.map((file) => path.relative(root, file).split(path.sep).join('/'))
		.sort();
}

export function walk(node, callback) {
	if (!node || typeof node !== 'object') return;
	if (Array.isArray(node)) {
		for (const child of node) walk(child, callback);
		return;
	}
	callback(node);
	for (const [key, child] of Object.entries(node)) {
		if (!['parent', 'loc', 'metadata'].includes(key)) walk(child, callback);
	}
}

function leaves(value) {
	const result = [];
	valueParser(value).walk((node) => {
		if (node.type === 'function' && node.value === 'var') {
			result.push(node);
			const comma = node.nodes.findIndex((part) => part.type === 'div' && part.value === ',');
			if (comma !== -1) result.push(...leaves(valueParser.stringify(node.nodes.slice(comma + 1))));
			return false;
		}
		if (node.type === 'word' || node.type === 'function') result.push(node);
	});
	return result;
}

export function checkSource(file, source, { tokens = new Map(), headingClasses = new Set() } = {}) {
	const diagnostics = [];
	const tokenFile = tokenFiles.includes(file);
	const shared = file.startsWith('src/lib/components/ui/');
	function report(rule, message, offset = 0) {
		const prefix = source.slice(0, offset);
		diagnostics.push({
			file,
			line: prefix.split('\n').length,
			column: offset - prefix.lastIndexOf('\n'),
			rule,
			message
		});
	}
	function css(text, base = 0, inline = false) {
		let root;
		try {
			root = postcss.parse(text, { from: file });
		} catch (error) {
			report(
				'syntax',
				`CSS를 해석하지 못했습니다: ${error.reason}`,
				base + (error.input?.offset ?? 0)
			);
			return;
		}
		root.walkDecls((decl) => {
			const offset = base + decl.source.start.offset;
			const previous = decl.prev();
			const exceptions =
				previous?.type === 'comment'
					? previous.text.match(/^ui-exception ([a-z,-]+):\s*(.{8,})$/)
					: null;
			const exempt = (rule) => exceptions?.[1].split(',').includes(rule);
			const fail = (rule, message) => {
				if (!exempt(rule)) report(rule, message, offset);
			};
			const prop = decl.prop.toLowerCase();
			const values = leaves(decl.value);
			if (decl.important)
				fail('important', '!important 대신 적용 순서·선택자 또는 공통 옵션을 수정하세요.');
			if (
				prop === 'font-size' ||
				(prop === 'font' && !/^(inherit|initial|unset)$/.test(decl.value))
			) {
				if (!['inherit', 'initial', 'unset'].includes(decl.value)) {
					const match = decl.value.match(/^var\((--font-size-\d+)\)$/);
					if (!match || !tokens.has(match[1]))
						fail(
							'font',
							'글자 크기는 등록된 var(--font-size-N)을 사용하세요. 일반 UI에서 clamp·vw·임의 크기를 쓰지 마세요.'
						);
				}
			}
			if (spacingProperty.test(prop)) {
				const invalid = values.some((node) => {
					if (node.type === 'function')
						return (
							node.value === 'var' &&
							(!/^--space-\d+$/.test(node.nodes[0]?.value ?? '') ||
								!tokens.has(node.nodes[0]?.value))
						);
					return ![
						'0',
						'auto',
						'inherit',
						'initial',
						'unset',
						'+',
						'-',
						'*',
						'/',
						'-1',
						'1'
					].includes(node.value);
				});
				if (invalid)
					fail(
						'spacing',
						'여백은 var(--space-N)을 사용하세요. 기본 간격은8·16·24px이며 0과 auto는 그대로 사용합니다.'
					);
			}
			if (!tokenFile) {
				const rawColor = values.some((node) =>
					node.type === 'function'
						? /^(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)$/.test(node.value)
						: /^#[\da-f]{3,8}$/i.test(node.value) || colorWords.has(node.value.toLowerCase())
				);
				if (rawColor)
					fail(
						'color',
						'색상은 공통 색상 토큰을 사용하세요. 새 색상은 tokens.css에서 용도를 정하세요.'
					);
			}
			if (
				tokenFile &&
				/^--font-size-/.test(prop) &&
				(!/^\d+px$/.test(decl.value) || parseInt(decl.value) % 2 || parseInt(decl.value) < 2)
			)
				fail('font', '글자 크기 토큰은 양의 짝수 px이어야 합니다.');
			if (
				tokenFile &&
				/^--space-/.test(prop) &&
				(!/^\d+px$/.test(decl.value) || (parseInt(decl.value) !== 2 && parseInt(decl.value) % 4))
			)
				fail('spacing', '여백 토큰은4px 단위 또는 보정용2px이어야 합니다.');
			if (
				!shared &&
				!inline &&
				decl.parent.type === 'rule' &&
				(protectedSelector.test(decl.parent.selector) ||
					[...headingClasses].some((name) => {
						const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
						return new RegExp(
							`\\.${escaped}(?![\\w-])[^,{]*[\\s>+~][^,{]*(?:h[1-6]|p|span|ui-step-number)\\b`
						).test(decl.parent.selector);
					}))
			)
				fail(
					'override',
					'공통 제목·번호·모달 내부 스타일은 ui.css나 공통 컴포넌트 옵션에서 수정하세요.'
				);
			for (const value of values) {
				if (value.type === 'function' && value.value === 'var') {
					const name = value.nodes[0]?.value;
					if (/^--(?:font-size|space|color)-/.test(name) && !tokens.has(name))
						fail('token', `등록되지 않은 토큰 ${name}입니다.`);
				}
			}
		});
	}
	if (file.endsWith('.css')) css(source);
	else if (file.endsWith('.svelte')) {
		let ast;
		try {
			ast = parse(source, { modern: true });
		} catch (error) {
			report('syntax', `Svelte를 해석하지 못했습니다: ${error.message}`, error.position?.[0] ?? 0);
			return diagnostics;
		}
		if (ast.css) css(ast.css.content.styles, ast.css.content.start);
		walk(ast.fragment, (node) => {
			if (
				node.type === 'SvelteElement' &&
				['button', 'dialog'].includes(node.tag?.value) &&
				!nativeElements[file]?.includes(node.tag.value)
			) {
				report(
					'component',
					'동적 태그에서도 Button·Dialog 공통 컴포넌트를 사용하세요.',
					node.start
				);
			}
			if (node.type === 'RegularElement') {
				if (['button', 'dialog'].includes(node.name) && !nativeElements[file]?.includes(node.name))
					report(
						'component',
						`${node.name === 'button' ? 'Button 또는 IconButton' : 'Dialog'} 공통 컴포넌트를 사용하세요.`,
						node.start
					);
				if (['input', 'select', 'textarea'].includes(node.name)) {
					const attr = (name) => node.attributes.find((item) => item.name === name);
					const type = attr('type')?.value?.[0]?.data;
					if (
						!['checkbox', 'radio', 'range', 'hidden', 'file', 'color'].includes(type) &&
						!source.slice(attr('class')?.start ?? 0, attr('class')?.end ?? 0).includes('ui-field')
					)
						report('field', '입력 요소에 공통 ui-field 클래스를 사용하세요.', node.start);
				}
			}
			if (node.type === 'Attribute' && node.name === 'style' && Array.isArray(node.value)) {
				if (node.value.every((part) => part.type === 'Text'))
					css(
						node.value.map((part) => part.data).join(''),
						node.value[0]?.start ?? node.start,
						true
					);
				else {
					const text = source.slice(node.value[0].start, node.value.at(-1).end);
					if (/(?:font(?:-size)?|margin|padding|gap|(?:^|;)\s*(?:color|background))\s*:/.test(text))
						report('dynamic', '동적 UI 스타일 대신 토큰과 컴포넌트 옵션을 사용하세요.', node.start);
				}
			}
			if (
				node.type === 'StyleDirective' &&
				/^(font(?:-size)?|color|background|margin.*|padding.*|(?:row-|column-)?gap)$/.test(
					node.name
				)
			) {
				if (Array.isArray(node.value) && node.value.every((part) => part.type === 'Text'))
					css(`${node.name}:${node.value.map((part) => part.data).join('')}`, node.start, true);
				else if (
					!dynamicStyles[file]?.[node.name]?.includes(
						source.slice(
							node.value?.expression?.start ?? node.value?.[0]?.expression?.start,
							node.value?.expression?.end ?? node.value?.[0]?.expression?.end
						)
					)
				)
					report('dynamic', '동적 UI 스타일 대신 토큰과 컴포넌트 옵션을 사용하세요.', node.start);
			}
		});
	}
	return diagnostics;
}

export async function collectHeadingClasses(root, files = null) {
	const headingClasses = new Set();
	// 호출부가 임의의 class를 붙여도 공통 제목을 덮어쓰는지 확인한다.
	for (const file of (files ?? (await listSources(root))).filter((file) =>
		file.endsWith('.svelte')
	)) {
		try {
			const ast = parse(await readFile(path.join(root, file), 'utf8'), { modern: true });
			const names = new Set(['SectionHeader']);
			for (const node of ast.instance?.content.body ?? []) {
				if (node.type !== 'ImportDeclaration' || !node.source.value.includes('components/ui'))
					continue;
				for (const specifier of node.specifiers) {
					if (
						specifier.imported?.name === 'SectionHeader' ||
						node.source.value.endsWith('/SectionHeader.svelte')
					)
						names.add(specifier.local.name);
				}
			}
			walk(ast.fragment, (node) => {
				if (node.type !== 'Component' || !names.has(node.name)) return;
				const value = node.attributes.find((attr) => attr.name === 'class')?.value;
				if (Array.isArray(value))
					for (const part of value)
						if (part.type === 'Text')
							for (const name of part.data.split(/\s+/).filter(Boolean)) headingClasses.add(name);
			});
		} catch {
			/* 수정 중인 파일의 문법 오류는 아래 해당 파일 검사에서 보고한다. */
		}
	}
	return headingClasses;
}

export async function checkFiles(root, files, { headingClasses } = {}) {
	const tokens = new Map();
	headingClasses ??= await collectHeadingClasses(root);
	for (const file of tokenFiles) {
		const source = await readFile(path.join(root, file), 'utf8');
		postcss.parse(source).walkDecls((decl) => {
			if (decl.prop.startsWith('--')) tokens.set(decl.prop, decl.value);
		});
	}
	const results = await Promise.all(
		files.map(async (file) => {
			try {
				return checkSource(file, await readFile(path.join(root, file), 'utf8'), {
					tokens,
					headingClasses
				});
			} catch (error) {
				if (error.code === 'ENOENT') return [];
				throw error;
			}
		})
	);
	return results.flat();
}

export function formatDiagnostics(diagnostics) {
	return diagnostics
		.map(
			({ file, line, column, rule, message }) => `${file}:${line}:${column} [ui/${rule}] ${message}`
		)
		.join('\n');
}
