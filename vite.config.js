import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    base: mode === 'electron' ? './' : '/',
    plugins: [react()],
    build: {
      outDir: mode === 'electron' ? 'dist' : 'dist-web',
      emptyOutDir: true,
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
        }
      }
    }
  }
})

