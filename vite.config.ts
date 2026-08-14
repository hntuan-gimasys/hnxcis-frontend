import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // In local dev the browser talks to the frontend dev server, which proxies
  // /api to the backend service (default: the backend running on localhost:8080).
  const devApiTarget = env.VITE_DEV_API_PROXY || 'http://localhost:8080';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
    },
    server: {
      host: '0.0.0.0',
      port: Number(env.PORT || 5173),
      proxy: {
        '/api': {
          target: devApiTarget,
          changeOrigin: true,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      host: '0.0.0.0',
      port: Number(env.PORT || 8080),
    },
  };
});
