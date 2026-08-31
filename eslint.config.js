import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

export default [
	{
		ignores: [
			'.context/**',
			'.svelte-kit/**',
			'build/**',
			'docs/design/**',
			'node_modules/**',
			'output/**',
			'package/**',
			'package-lock.json',
			'static/team-maker/**'
		]
	},
	js.configs.recommended,
	...svelte.configs['flat/recommended'],
	...svelte.configs['flat/prettier'],
	{
		files: ['**/*.{js,svelte}'],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		},
		rules: {
			'no-unused-vars': 'warn'
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: tsParser
			}
		}
	},
	prettier
];
