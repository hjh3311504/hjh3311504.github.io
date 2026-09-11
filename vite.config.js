import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { prepareQrFont } from './scripts/prepare_qr_font.js';

await prepareQrFont();

export default defineConfig({ plugins: [sveltekit()] });
