import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api/client'
import type {
  BreakdownRow,
  ContentStats,
  Kind,
  LearnerStats,
  RecentSession,
  StatsBreakdownOut,
  StatsSummary,
  TrendPoint,
} from '../api/types'
import { KindBadge, KIND_FILTER_LABEL } from '../components/GameCard'
import { Pagination } from '../components/Pagination'
import { PhonicsThumbnail } from '../components/PhonicsThumbnail'
import { StatCard } from '../components/StatCard'

/** mm:ss 형식 체류시간 포맷 */
function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** 긴 누적 시간용 — 1시간 이상이면 h:mm:ss, 아니면 mm:ss (학습자 총 체류처럼 커질 수 있는 값) */
function formatLongDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = m.toString().padStart(2, '0')
  const ss = s.toString().padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`
}

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}

/** 0.0~1.0 비율 → 정수 퍼센트 문자열 */
function pct(v: number): string {
  return `${Math.round(v * 100)}%`
}

/** 'YYYY-MM-DD' → 'MM/DD' (X축 라벨용) */
function shortDate(d: string): string {
  return d.length >= 10 ? `${d.slice(5, 7)}/${d.slice(8, 10)}` : d
}

/** 도넛 조각 색 — 카테고리별 구분 색상(종류 배지 색 계열). 값 큰 순 정렬 후 인덱스로 배정 */
const CATEGORY_COLORS = ['#0ea5e9', '#6366f1', '#14b8a6', '#f59e0b', '#94a3b8', '#ec4899']

/** 모노(블루+회색) 도넛 색 — 최댓값=리스트 블루, 나머지는 값 큰 순서대로 진한→연한 회색 */
const DONUT_GRAYS = ['#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0']
function donutFills(values: number[]): string[] {
  const maxIdx = values.reduce((best, v, i) => (v > values[best] ? i : best), 0)
  const rest = values
    .map((v, i) => ({ v, i }))
    .filter((o) => o.i !== maxIdx)
    .sort((a, b) => b.v - a.v)
  const out = new Array<string>(values.length)
  out[maxIdx] = '#0ea5e9'
  rest.forEach((o, rank) => {
    out[o.i] = DONUT_GRAYS[rank % DONUT_GRAYS.length]
  })
  return out
}

/** 단일 시리즈 막대 색 — 최댓값=파랑, 나머지는 값 큰 순서대로 진한→옅은 회색(연속 램프로 많은 막대도 매끈) */
function barFills(values: number[]): string[] {
  const maxIdx = values.reduce((best, v, i) => (v > values[best] ? i : best), 0)
  const rest = values
    .map((v, i) => ({ v, i }))
    .filter((o) => o.i !== maxIdx)
    .sort((a, b) => b.v - a.v)
  const out = new Array<string>(values.length)
  out[maxIdx] = '#0ea5e9'
  const n = rest.length
  const dark = [51, 65, 85] // slate-700
  const light = [203, 213, 225] // slate-300
  rest.forEach((o, rank) => {
    const t = n <= 1 ? 0 : rank / (n - 1) // 0=진함 → 1=옅음
    const c = dark.map((v, k) => Math.round(v + (light[k] - v) * t))
    out[o.i] = `rgb(${c[0]}, ${c[1]}, ${c[2]})`
  })
  return out
}

const TOP_N = 5
const PAGE_SIZE = 10 // 표 클라이언트 페이징 페이지 크기

/** 차트 툴팁 박스 — 테두리 없이 둥근 박스 + 부드러운 그림자, 텍스트 #101828 */
const TOOLTIP_STYLE: CSSProperties = {
  border: 'none',
  borderRadius: 12,
  boxShadow: '0 8px 24px rgba(15,23,42,0.14)',
  padding: '7px 11px',
  color: '#101828',
  fontSize: 12,
  backgroundColor: '#ffffff',
}

/** 도넛 커스텀 툴팁 — 이름 앞에 조각 색 원 + "이름 : 값단위 (%)" */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeDonutTooltip(unit: string, total: number, colorOf: (item: any) => string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (props: any) => {
    if (!props?.active || !props.payload?.length) return null
    const p = props.payload[0]
    const color = colorOf(p.payload) ?? '#0ea5e9'
    const pctv = total ? Math.round((Number(p.value) / total) * 100) : 0
    return (
      <div style={TOOLTIP_STYLE}>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
          <span>
            {p.name} : {Number(p.value).toLocaleString()}
            {unit} ({pctv}%)
          </span>
        </span>
      </div>
    )
  }
}

/** KPI 타일용 심플 라인 아이콘 (stroke 1.8, currentColor). 내용에 맞춰 배치. */
const svg = (children: React.ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="h-[32px] w-[32px]"
  >
    {children}
  </svg>
)
const IC_PLAYS = svg(<>
  <circle cx="12" cy="12" r="9" />
  <path d="M10.2 8.6l5 3.4-5 3.4z" />
</>)
const IC_LEARNERS = svg(<>
  <circle cx="12" cy="8" r="3.6" />
  <path d="M5 19.5c0-3.6 3.1-6 7-6s7 2.4 7 6" />
</>)
const IC_LIVE = svg(<>
  <circle cx="12" cy="12" r="2" />
  <path d="M7.8 7.8a6 6 0 0 0 0 8.4" />
  <path d="M16.2 7.8a6 6 0 0 1 0 8.4" />
  <path d="M5.2 5.2a9.5 9.5 0 0 0 0 13.6" />
  <path d="M18.8 5.2a9.5 9.5 0 0 1 0 13.6" />
</>)
const IC_COMPLETION = svg(<>
  <circle cx="12" cy="12" r="9" />
  <path d="M8 12.4l2.6 2.6L16 9.4" />
</>)
const IC_DURATION = svg(<>
  <circle cx="12" cy="12" r="9" />
  <path d="M12 7.4V12l3.1 2" />
</>)
const IC_CONTENT = svg(<>
  <path d="M12 3.2l8 4.4-8 4.4-8-4.4z" />
  <path d="M4 12l8 4.4 8-4.4" />
  <path d="M4 16.4l8 4.4 8-4.4" />
</>)
const IC_RATING = svg(
  <path d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.3-4.8-2.5-4.8 2.5.9-5.3L4.2 9.7l5.4-.8z" />,
)
const IC_REVIEWS = svg(
  <path d="M4.5 6.4a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v6.8a2 2 0 0 1-2 2H9l-4 3.4V6.4z" />,
)

/** 배열을 클라이언트에서 페이지로 자른다. 데이터가 줄면 현재 페이지를 자동 클램프. */
function usePaged<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  // 데이터가 줄어 현재 페이지가 범위를 벗어나면 저장된 페이지 자체를 되돌린다.
  // (표시값만 클램프하면 데이터가 다시 늘었을 때 안 보던 페이지로 튀어오름)
  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])
  const current = Math.min(page, pageCount)
  const slice = items.slice((current - 1) * pageSize, current * pageSize)
  return { page: current, pageCount, setPage, slice }
}

const NONE_COLOR = '#e2e8f0' // 미분류 = slate-200

/** 도넛 중앙 오버레이 — 합계 라벨 + 총 수치. 도넛 영역 정중앙 */
function DonutCenter({ label, value }: { label: string; value: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span className="text-2xl font-extrabold text-[#101828]">{value}</span>
    </div>
  )
}

/** 도넛 세로 범례 — 차트 오른쪽에 세로 목록으로 표시 */
function DonutLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex shrink-0 flex-col gap-2.5 text-xs font-medium text-gray-600">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: it.color }} />
          <span className="whitespace-nowrap">{it.label}</span>
        </li>
      ))}
    </ul>
  )
}

/** 막대/선 차트 커스텀 툴팁 — 라벨 + 각 계열 [색 원] 이름 : 값 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MultiTooltip(props: any) {
  if (!props?.active || !props.payload?.length) return null
  return (
    <div style={TOOLTIP_STYLE}>
      {props.label != null && props.label !== '' && (
        <div className="mb-1 font-semibold">{props.label}</div>
      )}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {props.payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: p.color ?? p.stroke ?? p.fill ?? '#0ea5e9' }}
          />
          <span>
            {p.name} : {Number(p.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

/** 플레이/완료 2계열 차트용 커스텀 범례 — 타이틀 우측에 배치 */
function PlayLegend() {
  return (
    <span className="flex items-center gap-3 text-xs font-medium text-gray-500">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#0ea5e9]" />
        플레이
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#94a3b8]" />
        완료
      </span>
    </span>
  )
}

/** 종류(kind)별 차트 색상 — 종류 배지(.kind-badge-*) 색과 동일 계열 */
const KIND_CHART_COLOR: Record<Kind, string> = {
  html: '#0ea5e9', // 인터랙티브 — sky
  zip: '#6366f1', // 게임 패키지 — indigo
  video: '#14b8a6', // 비디오 — teal
  audio: '#f59e0b', // 오디오 — amber
  url: '#94a3b8', // 웹 링크 — slate
}

/** 레벨/스킬 구성 도넛 — contentCount 분포. colored=true면 카테고리별 색, 아니면 블루+회색 */
function BreakdownDonut({
  title,
  rows,
  colored = false,
  colorByKey,
  ordered = false,
}: {
  title: string
  rows: BreakdownRow[]
  colored?: boolean
  colorByKey?: Record<string, string>
  ordered?: boolean // true면 rows 원래 순서 유지(ECP1→5), 아니면 값 큰 순 정렬
}) {
  const filtered = rows.filter((r) => r.contentCount > 0)
  const data = ordered
    ? filtered
    : [...filtered].sort((a, b) => b.contentCount - a.contentCount)
  // 블루+회색 모드용 색 배정(colored면 미사용)
  const monoFills = donutFills(data.map((d) => (d.key === '__none__' ? -1 : d.contentCount)))
  const fillOf = (d: BreakdownRow, i: number) =>
    d.key === '__none__'
      ? NONE_COLOR
      : (colorByKey?.[d.key] ?? (colored ? CATEGORY_COLORS[i % CATEGORY_COLORS.length] : monoFills[i]))
  const colorByKeyLocal: Record<string, string> = Object.fromEntries(
    data.map((d, i) => [d.key, fillOf(d, i)]),
  )
  // 중앙 라벨용 — 총 콘텐츠 수
  const total = data.reduce((s, d) => s + d.contentCount, 0)
  return (
    <div className="rounded-2xl bg-white px-6 py-6 shadow-card">
      <h2 className="mb-3 text-lg font-bold text-gray-900">{title}</h2>
      {data.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
          아직 집계된 데이터가 없습니다.
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 sm:relative sm:flex-row sm:gap-0">
          <div className="relative w-[210px] shrink-0">
            <DonutCenter label="총 콘텐츠" value={`${total}개`} />
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="contentCount"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={96}
                  paddingAngle={0}
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((d, i) => (
                    <Cell key={d.key} fill={fillOf(d, i)} />
                  ))}
                </Pie>
                <Tooltip content={makeDonutTooltip('개', total, (it) => colorByKeyLocal[it.key])} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* 범례: 도넛 정중앙 기준 오른쪽 32px(원 반지름 96 + 32) 지점에 배치 */}
          <div className="sm:absolute sm:left-1/2 sm:top-1/2 sm:ml-[128px] sm:-translate-y-1/2">
            <DonutLegend items={data.map((d, i) => ({ label: d.label, color: fillOf(d, i) }))} />
          </div>
        </div>
      )}
    </div>
  )
}

/** 레벨/스킬 플레이·완료 막대 — 학습자 BarChart 패턴 복제(2계열) */
function BreakdownBars({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  const data = rows.filter((r) => r.plays > 0 || r.completions > 0)
  return (
    <div className="rounded-2xl bg-white px-6 py-6 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <PlayLegend />
      </div>
      {data.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
          아직 플레이 기록이 없습니다.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 8, right: 36, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={32} />
            <Tooltip cursor={{ fill: 'rgba(14,165,233,0.08)' }} content={MultiTooltip} />
            <Bar dataKey="plays" name="플레이" fill="#0ea5e9" maxBarSize={20} radius={[6, 6, 0, 0]} />
            <Bar dataKey="completions" name="완료" fill="#94a3b8" maxBarSize={20} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

/** 플레이 수 → 히트맵 셀 배경/글자색. 값이 클수록 진한 sky. 0이면 색 없음. */
function hexToRgb(hex: string): number[] {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}
/** 히트맵 셀 색 — 거의 흰색(저) → 열(스킬)의 카테고리 색(고). 값 차이를 뚜렷하게. */
function heatStyle(plays: number, max: number, baseHex: string): CSSProperties {
  if (plays <= 0 || max <= 0) return {}
  // 감마(1.5)로 낮은 값을 더 연하게 눌러 대비 확대
  const t = 0.04 + 0.96 * Math.pow(plays / max, 1.5)
  const lo = [248, 250, 252] // slate-50
  const hi = hexToRgb(baseHex)
  const c = lo.map((v, i) => Math.round(v + (hi[i] - v) * t))
  return { backgroundColor: `rgb(${c[0]}, ${c[1]}, ${c[2]})`, color: t > 0.6 ? '#fff' : '#334155' }
}

/** 레벨×스킬 교차 히트맵 — 행=레벨, 열=스킬, 셀 색 농도=플레이 수. 순서는 byLevel/bySkill(플레이 desc). */
function LevelSkillHeatmap({
  data,
  colColor,
}: {
  data: StatsBreakdownOut | undefined
  colColor: Record<string, string>
}) {
  const cells = data?.byLevelSkill ?? []
  const levels = data?.byLevel ?? [] // 행 순서
  const skills = data?.bySkill ?? [] // 열 순서
  const cellMap = new Map(cells.map((c) => [`${c.levelKey}__${c.skillKey}`, c]))
  const max = cells.reduce((m, c) => Math.max(m, c.plays), 0)

  return (
    <div className="rounded-2xl bg-white shadow-card">
      <h2 className="px-6 pb-3 pt-6 text-lg font-bold text-gray-900">레벨 × 스킬 매핑 (플레이 수)</h2>
      {cells.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center px-6 pb-6 text-sm text-gray-400">
          아직 집계된 데이터가 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto pb-6">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-y border-gray-200 bg-slate-50 text-xs font-semibold text-gray-500">
                <th className="px-2 py-3">레벨 \ 스킬</th>
                {skills.map((s) => (
                  <th key={s.key} className="px-2 py-3">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {levels.map((lv) => (
                <tr key={lv.key}>
                  <td className="whitespace-nowrap px-2 py-1.5 text-xs font-semibold text-gray-700">
                    {lv.label}
                  </td>
                  {skills.map((s) => {
                    const c = cellMap.get(`${lv.key}__${s.key}`)
                    const plays = c?.plays ?? 0
                    return (
                      <td
                        key={s.key}
                        className="px-1 py-1"
                        title={
                          c
                            ? `${lv.label} · ${s.label} — 플레이 ${c.plays} · 완료 ${c.completions} · 콘텐츠 ${c.contentCount}개`
                            : `${lv.label} · ${s.label} — 없음`
                        }
                      >
                        <div
                          className="rounded-lg px-2 py-2 text-xs font-semibold tabular-nums"
                          style={heatStyle(plays, max, colColor[s.key] ?? '#0ea5e9')}
                        >
                          {plays > 0 ? plays : c && c.contentCount > 0 ? '·' : ''}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/** §16 통계 대시보드 (관리자 전용) — KPI · 추이 · 종류 분포 · 학습자 참여 · 품질 리스트 · 상세 표 */
export function StatsPage() {
  const summary = useQuery<StatsSummary>({
    queryKey: ['stats', 'summary'],
    queryFn: () => api.get<StatsSummary>('/api/stats/summary'),
    refetchInterval: 15000, // 실시간 접속 지표 갱신
  })

  const trends = useQuery<TrendPoint[]>({
    queryKey: ['stats', 'trends'],
    queryFn: () => api.get<TrendPoint[]>('/api/stats/trends?days=30'),
  })

  const learners = useQuery<LearnerStats[]>({
    queryKey: ['stats', 'learners'],
    queryFn: () => api.get<LearnerStats[]>('/api/stats/learners?limit=20'),
  })

  const {
    data: contents,
    isLoading: contentsLoading,
    isError: contentsError,
  } = useQuery<ContentStats[]>({
    queryKey: ['stats', 'contents'],
    queryFn: () => api.get<ContentStats[]>('/api/stats/contents'),
  })

  const {
    data: sessions,
    isLoading: sessionsLoading,
    isError: sessionsError,
  } = useQuery<RecentSession[]>({
    queryKey: ['stats', 'sessions'],
    // 최근 200건 범위 내에서 클라이언트 페이징(그 이상은 추후 서버 페이징으로 확장 가능)
    queryFn: () => api.get<RecentSession[]>('/api/stats/sessions?limit=200'),
    refetchInterval: 15000, // "진행 중" 상태 갱신
  })

  const breakdown = useQuery<StatsBreakdownOut>({
    queryKey: ['stats', 'breakdown'],
    queryFn: () => api.get<StatsBreakdownOut>('/api/stats/breakdown'),
  })

  // 콘텐츠 종류(kind)별 플레이 수 분포 — 도넛 차트용
  const kindData = useMemo(() => {
    if (!contents) return []
    const totals = new Map<Kind, number>()
    for (const c of contents) {
      totals.set(c.kind, (totals.get(c.kind) ?? 0) + c.uses)
    }
    return Array.from(totals.entries())
      .filter(([, value]) => value > 0)
      .map(([kind, value]) => ({ kind, name: KIND_FILTER_LABEL[kind], value }))
      .sort((a, b) => b.value - a.value) // 값 큰 순 정렬
  }, [contents])
  // 종류 도넛 중앙 라벨용 — 총 플레이 수
  const kindTotal = kindData.reduce((s, d) => s + d.value, 0)

  // 스킬 색 맵(스킬 키 → 카테고리 색) — 스킬 도넛과 히트맵 열 색을 동일하게 맞춤
  const skillColor: Record<string, string> = {}
  ;(breakdown.data?.bySkill ?? []).forEach((s, i) => {
    skillColor[s.key] = CATEGORY_COLORS[i % CATEGORY_COLORS.length]
  })

  // 인기 Top-N (플레이 수 상위) — /contents는 uses desc로 이미 정렬됨
  const topByUses = useMemo(
    () => (contents ?? []).filter((c) => c.uses > 0).slice(0, TOP_N),
    [contents],
  )

  // 저평점 주의 (평가 1건 이상 & 평점 낮은 순)
  const lowRated = useMemo(
    () =>
      (contents ?? [])
        .filter((c) => c.ratingCount >= 1 && c.ratingAvg != null)
        .sort((a, b) => (a.ratingAvg ?? 0) - (b.ratingAvg ?? 0))
        .slice(0, TOP_N),
    [contents],
  )

  // 표 클라이언트 페이징(요약 Top-N은 전체 기준 유지, 표만 페이지로 자름)
  const learnersPaged = usePaged(learners.data ?? [], PAGE_SIZE)
  const contentsPaged = usePaged(contents ?? [], PAGE_SIZE)
  const sessionsPaged = usePaged(sessions ?? [], PAGE_SIZE)
  // 학습자별 플레이 수 막대는 상위 10명만(limit 상향으로 막대가 과도해지는 것 방지)
  const topLearners = (learners.data ?? []).slice(0, 10)
  const learnerBarFills = barFills(topLearners.map((l) => l.plays))

  const s = summary.data
  const hasError =
    summary.isError ||
    trends.isError ||
    learners.isError ||
    contentsError ||
    sessionsError ||
    breakdown.isError

  return (
    <main className="stats-page mx-auto w-full max-w-6xl space-y-8 px-4 py-8">
      <header className="[text-shadow:0_1px_6px_rgba(0,0,0,0.35)]!">
        <h1 className="text-2xl font-bold text-white">통계 대시보드</h1>
        <p className="mt-0.5 text-sm text-white/85">
          학습자 참여와 콘텐츠 사용 현황을 한눈에 봅니다
        </p>
      </header>

      {hasError && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          일부 통계를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      )}

      {/* ① KPI 요약 카드 — 넓은 화면(xl)에서 8개 한 줄, 좁은 화면은 반응형 */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        <StatCard label="총 플레이" value={s ? s.totalPlays.toLocaleString() : '—'} icon={IC_PLAYS} />
        <StatCard
          label="활성 학습자"
          value={s ? s.activeLearners.toLocaleString() : '—'}
          icon={IC_LEARNERS}
        />
        <StatCard
          label="실시간 접속"
          value={s ? s.activeNow : '—'}
          hint="최근 5분"
          icon={IC_LIVE}
        />
        <StatCard
          label="전체 완료율"
          value={s ? pct(s.overallCompletionRate) : '—'}
          icon={IC_COMPLETION}
        />
        <StatCard
          label="평균 체류"
          value={s ? formatDuration(s.avgDurationSeconds) : '—'}
          icon={IC_DURATION}
        />
        <StatCard
          label="플레이된 콘텐츠"
          value={s ? s.distinctContent.toLocaleString() : '—'}
          icon={IC_CONTENT}
        />
        <StatCard
          label="평균 별점"
          value={s && s.avgRating != null ? s.avgRating.toFixed(1) : '—'}
          icon={IC_RATING}
        />
        <StatCard
          label="총 평가 수"
          value={s ? s.totalRatings.toLocaleString() : '—'}
          icon={IC_REVIEWS}
        />
      </section>

      {/* ② 차트 — 플레이 추이 + 종류 분포 */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white px-6 py-6 shadow-card">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-gray-900">플레이 추이 (최근 30일)</h2>
            <PlayLegend />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trends.data ?? []} margin={{ top: 8, right: 36, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} minTickGap={24} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={32} />
              <Tooltip cursor={{ fill: 'rgba(14,165,233,0.08)' }} content={MultiTooltip} />
              <Line type="monotone" dataKey="plays" name="플레이" stroke="#0ea5e9" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="completions" name="완료" stroke="#94a3b8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl bg-white px-6 py-6 shadow-card">
          <h2 className="mb-3 text-lg font-bold text-gray-900">콘텐츠 종류 분포</h2>
          {kindData.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
              아직 집계된 데이터가 없습니다.
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              <div className="relative w-[210px] shrink-0">
                <DonutCenter label="총 플레이" value={`${kindTotal.toLocaleString()}회`} />
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie
                      data={kindData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={96}
                      paddingAngle={0}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {kindData.map((d) => (
                        <Cell key={d.kind} fill={KIND_CHART_COLOR[d.kind]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={makeDonutTooltip('회', kindTotal, (it) => KIND_CHART_COLOR[it.kind as Kind])}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="sm:absolute sm:left-1/2 sm:top-1/2 sm:ml-[128px] sm:-translate-y-1/2">
                <DonutLegend
                  items={kindData.map((d) => ({ label: d.name, color: KIND_CHART_COLOR[d.kind] }))}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ②-b 레벨·스킬 분석 — 구성(도넛) + 플레이·완료(막대) */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BreakdownDonut title="레벨별 콘텐츠 구성" rows={breakdown.data?.byLevel ?? []} ordered />
        <BreakdownBars title="레벨별 플레이·완료" rows={breakdown.data?.byLevel ?? []} />
        <BreakdownDonut
          title="스킬별 콘텐츠 구성"
          rows={breakdown.data?.bySkill ?? []}
          colorByKey={skillColor}
          ordered
        />
        <BreakdownBars title="스킬별 플레이·완료" rows={breakdown.data?.bySkill ?? []} />
      </section>

      {/* ②-c 레벨 × 스킬 매핑 히트맵 */}
      <section>
        <LevelSkillHeatmap data={breakdown.data} colColor={skillColor} />
      </section>

      {/* ③ 학습자 참여도 — 한 박스: 왼쪽 표 + 오른쪽 차트 */}
      <section className="grid grid-cols-1 rounded-2xl bg-white shadow-card lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <h2 className="px-6 pb-3 pt-6 text-lg font-bold text-gray-900">학습자 참여도</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-gray-200 bg-slate-50 text-left text-xs font-semibold text-gray-500">
                  <th className="px-2.5 py-3 font-semibold">#</th>
                  <th className="px-2.5 py-3 font-semibold">학습자</th>
                  <th className="px-2.5 py-3 font-semibold">플레이</th>
                  <th className="px-2.5 py-3 font-semibold">콘텐츠</th>
                  <th className="px-2.5 py-3 font-semibold">완료율</th>
                  <th className="px-2.5 py-3 font-semibold">총 체류</th>
                  <th className="px-2.5 py-3 font-semibold">평가</th>
                </tr>
              </thead>
              <tbody>
                {learners.isLoading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      불러오는 중…
                    </td>
                  </tr>
                )}
                {learners.data && learners.data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      아직 학습자 활동이 없습니다.
                    </td>
                  </tr>
                )}
                {learnersPaged.slice.map((l, i) => (
                  <tr key={l.userId} className="border-b border-gray-50 last:border-0">
                    <td className="px-2.5 py-3 text-gray-400">
                      {(learnersPaged.page - 1) * PAGE_SIZE + i + 1}
                    </td>
                    <td className="px-2.5 py-3 font-semibold text-gray-800">{l.userName}</td>
                    <td className="px-2.5 py-3 text-gray-600">{l.plays}</td>
                    <td className="px-2.5 py-3 text-gray-600">{l.distinctContent}</td>
                    <td className="px-2.5 py-3 text-gray-600">{pct(l.completionRate)}</td>
                    <td className="px-2.5 py-3 text-gray-600">
                      {formatLongDuration(l.totalDurationSeconds)}
                    </td>
                    <td className="px-2.5 py-3 text-gray-600">{l.ratingsGiven}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 pb-6 pt-1">
            <Pagination
              page={learnersPaged.page}
              pageCount={learnersPaged.pageCount}
              onChange={learnersPaged.setPage}
            />
          </div>
        </div>

        {/* 오른쪽 차트: 그림자 있는 흰 박스로 학습자 참여도 위에 떠 있는 느낌 (왼쪽으로 살짝 겹침) */}
        <div className="relative z-10 my-3 mr-3 flex flex-col rounded-2xl bg-white px-6 py-6 shadow-[0_6px_28px_rgba(15,23,42,0.16)] lg:ml-3">
          <h2 className="mb-3 text-lg font-bold text-gray-900">학습자별 플레이 수</h2>
          <div className="flex flex-1 flex-col justify-center">
          {learners.data && learners.data.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
              아직 학습자 활동이 없습니다.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={440}>
              <BarChart
                layout="vertical"
                data={topLearners}
                margin={{ top: 12, right: 32, left: 12, bottom: 12 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="userName"
                  tick={{ fontSize: 11 }}
                  width={82}
                  interval={0}
                />
                <Tooltip cursor={{ fill: 'rgba(14,165,233,0.08)' }} content={MultiTooltip} />
                <Bar dataKey="plays" name="플레이" maxBarSize={16} radius={[0, 6, 6, 0]}>
                  {topLearners.map((l, i) => (
                    <Cell key={l.userName ?? i} fill={learnerBarFills[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          </div>
        </div>
      </section>

      {/* ④ 품질 리스트 — 인기 Top-N + 저평점 주의 */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white px-6 py-6 shadow-card">
          <h2 className="mb-3 text-lg font-bold text-gray-900">인기 Top {TOP_N}</h2>
          {topByUses.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">아직 플레이 기록이 없습니다.</p>
          ) : (
            <ol className="space-y-2.5">
              {topByUses.map((c, i) => (
                <li key={c.contentId} className="flex items-center gap-3 text-sm">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-gray-300 bg-white text-xs font-bold text-slate-500">
                    {i + 1}
                  </span>
                  <PhonicsThumbnail
                    item={{ id: c.contentId, title: c.title }}
                    className="h-11 w-11 shrink-0 rounded-lg"
                  />
                  <span className="flex-1 truncate font-semibold text-gray-800">{c.title}</span>
                  <span className="shrink-0 text-gray-500">{c.uses}회</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rounded-2xl bg-white px-6 py-6 shadow-card">
          <h2 className="mb-3 text-lg font-bold text-gray-900">저평점 주의</h2>
          {lowRated.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">아직 평가 데이터가 없습니다.</p>
          ) : (
            <ol className="space-y-2.5">
              {lowRated.map((c, i) => (
                <li key={c.contentId} className="flex items-center gap-3 text-sm">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-gray-300 bg-white text-xs font-bold text-slate-500">
                    {i + 1}
                  </span>
                  <PhonicsThumbnail
                    item={{ id: c.contentId, title: c.title }}
                    className="h-11 w-11 shrink-0 rounded-lg"
                  />
                  <span className="flex-1 truncate font-semibold text-gray-800">{c.title}</span>
                  <span className="shrink-0 text-[#0ea5e9]">
                    ★ {c.ratingAvg?.toFixed(1)}{' '}
                    <span className="text-gray-400">({c.ratingCount})</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* ⑤ 콘텐츠별 상세 통계 */}
      <section>
        <div className="rounded-2xl bg-white shadow-card">
          <h2 className="px-6 pb-3 pt-6 text-lg font-bold text-gray-900">콘텐츠별 통계</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-y border-gray-200 bg-slate-50 text-left text-xs font-semibold text-gray-500">
                <th className="px-4 py-3 font-semibold">콘텐츠</th>
                <th className="px-4 py-3 font-semibold">종류</th>
                <th className="px-4 py-3 font-semibold">플레이 수</th>
                <th className="px-4 py-3 font-semibold">완료 수</th>
                <th className="px-4 py-3 font-semibold">완료율</th>
                <th className="px-4 py-3 font-semibold">평균 체류</th>
                <th className="px-4 py-3 font-semibold">평점</th>
                <th className="px-4 py-3 font-semibold">마지막 플레이</th>
              </tr>
            </thead>
            <tbody>
              {contentsLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    불러오는 중…
                  </td>
                </tr>
              )}
              {contents && contents.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    아직 집계된 데이터가 없습니다.
                  </td>
                </tr>
              )}
              {contentsPaged.slice.map((c) => {
                const rate = c.uses > 0 ? Math.round((c.completions / c.uses) * 100) : 0
                return (
                  <tr key={c.contentId} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      <span className="flex items-center gap-2.5">
                        <PhonicsThumbnail
                          item={{ id: c.contentId, title: c.title }}
                          className="h-9 w-9 shrink-0 rounded-md"
                        />
                        <span className="truncate">{c.title}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <KindBadge kind={c.kind} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.uses}</td>
                    <td className="px-4 py-3 text-gray-600">{c.completions}</td>
                    <td className="px-4 py-3 text-gray-600">{rate}%</td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDuration(c.avgDurationSeconds)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.ratingAvg != null ? (
                        <span className="text-[#0ea5e9]">
                          ★ {c.ratingAvg.toFixed(1)}{' '}
                          <span className="text-gray-400">({c.ratingCount})</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDateTime(c.lastPlayedAt)}</td>
                  </tr>
                )
              })}
            </tbody>
            </table>
          </div>
          <div className="px-6 pb-6 pt-1">
            <Pagination
              page={contentsPaged.page}
              pageCount={contentsPaged.pageCount}
              onChange={contentsPaged.setPage}
            />
          </div>
        </div>
      </section>

      {/* ⑥ 최근 세션 */}
      <section>
        <div className="rounded-2xl bg-white shadow-card">
          <h2 className="px-6 pb-3 pt-6 text-lg font-bold text-gray-900">최근 세션</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-y border-gray-200 bg-slate-50 text-left text-xs font-semibold text-gray-500">
                <th className="px-4 py-3 font-semibold">학생</th>
                <th className="px-4 py-3 font-semibold">콘텐츠</th>
                <th className="px-4 py-3 font-semibold">시작 시각</th>
                <th className="px-4 py-3 font-semibold">체류시간</th>
                <th className="px-4 py-3 font-semibold">완료</th>
                <th className="px-4 py-3 font-semibold">상태</th>
              </tr>
            </thead>
            <tbody>
              {sessionsLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    불러오는 중…
                  </td>
                </tr>
              )}
              {sessions && sessions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    아직 플레이 기록이 없습니다.
                  </td>
                </tr>
              )}
              {sessionsPaged.slice.map((session) => (
                <tr key={session.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 font-semibold text-gray-800">{session.userName}</td>
                  <td className="px-4 py-3 text-gray-600">{session.title}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDateTime(session.startedAt)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDuration(session.durationSeconds)}
                  </td>
                  <td className="px-4 py-3">{session.completed ? '✓' : '—'}</td>
                  <td className="px-4 py-3">
                    {session.open ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0ea5e9]">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#0ea5e9]" />
                        진행 중
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">종료됨</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
          <div className="px-6 pb-6 pt-1">
            <Pagination
              page={sessionsPaged.page}
              pageCount={sessionsPaged.pageCount}
              onChange={sessionsPaged.setPage}
            />
          </div>
        </div>
      </section>
    </main>
  )
}
