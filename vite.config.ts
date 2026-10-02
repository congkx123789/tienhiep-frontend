import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    base: mode === 'electron' ? './' : '/',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: mode === 'electron' ? 'dist' : 'dist-web',
      emptyOutDir: true,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        onwarn(warning) {
          if (warning.code === 'PLUGIN_TIMINGS' || warning.message?.includes('PLUGIN_TIMINGS')) return;
          throw new Error(`🚨 [STRICT ZERO-WARNING ERROR] Phát hiện cảnh báo trong lúc Build: ${warning.message}`);
        },
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/lucide-react/')) {
              return 'vendor-icons';
            }
          },
        },
      },
    },
    server: {
      port: 3532,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5051',
          changeOrigin: true,
        },
        '/translate': {
          target: 'http://127.0.0.1:5051',
          changeOrigin: true,
        },
        '/translate_stream': {
          target: 'http://127.0.0.1:5051',
          changeOrigin: true,
        },
        '/v1': {
          target: 'http://127.0.0.1:5051',
          changeOrigin: true,
        },
      },
    },
  };
});
