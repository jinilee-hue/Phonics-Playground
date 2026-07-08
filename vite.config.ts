import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:8200', // 플레이그라운드 백엔드
      '/c': 'http://localhost:8100', // 스튜디오 번들 서빙 — iframe same-origin-subpath 유지
    },
  },
})
