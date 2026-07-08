import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// @types/node 미설치 환경 — CI 빌드 시 base 경로 주입용 process.env만 최소 선언
declare const process: { env: Record<string, string | undefined> }

export default defineConfig({
  // GitHub Pages는 /<repo>/ 하위에 서빙 → CI에서 BASE_PATH 주입. 로컬/일반 빌드는 '/'.
  base: process.env.BASE_PATH ?? '/',
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
