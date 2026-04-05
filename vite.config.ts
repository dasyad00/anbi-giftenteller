/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import viteRollbar from 'vite-plugin-rollbar-sourcemap';
import { rollbarConfig } from './src/lib/rollbar';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const deployUrl = new URL(process.env.DEPLOY_URL);
  const baseUrl = deployUrl.origin;
  const rollbarToken = env.VITE_ROLLBAR_ACCESS_TOKEN || process.env.VITE_ROLLBAR_ACCESS_TOKEN;
  return {
    plugins: [
      react(),
      tailwindcss(),
      viteRollbar({
        accessToken: rollbarToken,
        version: rollbarConfig.version,
        baseUrl: baseUrl,
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
