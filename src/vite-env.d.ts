/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 디자인 작업용 모드 — 'true'면 로그인/권한 체크를 우회 (npm run design) */
  readonly VITE_DESIGN_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
