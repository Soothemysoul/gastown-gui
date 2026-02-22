import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:7667',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:7667',
        ws: true,
      },
    },
  },
})
