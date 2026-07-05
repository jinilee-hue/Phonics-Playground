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
  thumbUrl: string | null // 스튜디오 등록 썸네일(/c/{id}/_thumb.png). 없으면 null → 카드에서 플레이스홀더
  courseCode: string | null // 레벨 코드(예: ECP5). 미태깅이면 null → 필터/배지 미표시
  skillCode: string | null // 주 스킬 코드(예: PH.LTR.ALPHABET). 미태깅이면 null
  skillLabel: string | null // 스킬 택소노미 라벨. 택소노미 미설정 시 코드와 동일값일 수 있음
  uses: number
  completions: number
  ratingAvg: number | null
  ratingCount: number
  myRating: number | null
}

/** §6 별점 평가(A) — upsert 후 갱신된 내 점수·평균·개수 */
export interface RatingOut {
  myRating: number
  avg: number
  count: number
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
  ratingAvg: number | null
  ratingCount: number
}

/** §16 대시보드 상단 KPI 요약 (관리자) */
export interface StatsSummary {
  totalPlays: number
  activeLearners: number
  activeNow: number
  overallCompletionRate: number // 0.0~1.0
  avgDurationSeconds: number
  distinctContent: number
  avgRating: number | null
  totalRatings: number
}

/** §16 일자별 플레이 추이 (관리자) — date는 KST 기준 YYYY-MM-DD */
export interface TrendPoint {
  date: string
  plays: number
  completions: number
}

/** §16 학습자별 참여도 집계 (관리자) */
export interface LearnerStats {
  userId: number
  userName: string
  plays: number
  distinctContent: number
  completions: number
  completionRate: number // 0.0~1.0
  totalDurationSeconds: number
  ratingsGiven: number
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

/** §16 레벨/스킬 차원 1버킷 — 콘텐츠 구성(개수) + 플레이/완료 집계 */
export interface BreakdownRow {
  key: string // course_code 또는 skill_code. 미태깅은 "__none__"
  label: string // 표시명 — 레벨=코드, 스킬=라벨(없으면 코드), 미태깅="미분류"
  contentCount: number
  plays: number
  completions: number
}

/** §16 레벨별·스킬별 분석 — 콘텐츠 구성 + 학습 플레이 통계 */
export interface StatsBreakdownOut {
  byLevel: BreakdownRow[]
  bySkill: BreakdownRow[]
}
