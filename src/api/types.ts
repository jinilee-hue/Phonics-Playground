/** 역할 — 전 페이지 로그인 필수(§12 RBAC) */
export type Role = 'student' | 'admin'

/** 콘텐츠 종류 — studio 카탈로그와 동일한 kind 집합 */
export type Kind = 'html' | 'zip' | 'video' | 'audio' | 'url'

export interface User {
  id: number
  email: string
  name: string
  role: Role
  createdAt: string
}

/** §6 갤러리 — 스튜디오 카탈로그 + 로컬 세션 집계(uses/completions) 조인 결과 */
export interface GalleryItem {
  id: number
  title: string
  description: string
  kind: Kind
  entryUrl: string | null
  externalUrl: string | null
  publishedAt: string | null
  uses: number
  completions: number
}

/** stale=true면 카탈로그 갱신 실패로 마지막 성공본을 보여주는 중임을 의미 */
export interface GalleryOut {
  items: GalleryItem[]
  stale: boolean
}

/** §6 플레이 세션 — 체류시간·완료여부 자동수집 */
export interface PlaySession {
  id: number
  contentId: number
  startedAt: string
  endedAt: string | null
  durationSeconds: number
  completed: boolean
}

/** §16 콘텐츠별 통계 (관리자) */
export interface ContentStats {
  contentId: number
  title: string
  kind: Kind
  uses: number
  completions: number
  avgDurationSeconds: number
  lastPlayedAt: string | null
}

/** §16 최근 세션 (관리자) — open=미종료 세션 플래그 */
export interface RecentSession {
  id: number
  userName: string
  contentId: number
  title: string
  startedAt: string
  durationSeconds: number
  completed: boolean
  open: boolean
}
