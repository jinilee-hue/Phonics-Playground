import type { User } from './api/types'

/**
 * 디자인 작업용 모드.
 * `npm run design`(VITE_DESIGN_MODE=true)으로 실행하면 켜진다.
 * - 로그인/권한 체크를 우회하고(auth.tsx)
 * - 모든 `/api/*` 호출을 백엔드로 보내지 않고 목업 데이터로 대체한다(api/client.ts + api/designMocks.ts).
 * 평소 `npm run dev`에서는 꺼져 있어(false) 실제 인증·데이터가 그대로 동작한다.
 *
 * 플래그/가상 유저를 별도 모듈로 둔 이유: client.ts ↔ auth.tsx 순환 참조 방지.
 */
export const DESIGN_MODE = import.meta.env.VITE_DESIGN_MODE === 'true'

/** 디자인 모드에서 비로그인 상태일 때 쓰는 가상 관리자 — 모든 메뉴가 보이도록 admin */
export const DESIGN_USER: User = {
  id: 0,
  email: 'design@demo.test',
  name: '디자인',
  role: 'admin',
  createdAt: '2000-01-01T00:00:00.000Z',
}
