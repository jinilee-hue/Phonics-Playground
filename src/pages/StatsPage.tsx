import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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

/** 종류별 도넛 색상 — KindBadge에는 종류별 색이 없어 여기서 정의(라벨은 KIND_LABEL 재사용) */
const KIND_COLOR: Record<Kind, string> = {
  html: '#0ea5e9', // brand-500
  zip: '#8b5cf6', // violet
  video: '#f59e0b', // amber
  audio: '#10b981', // emerald
  url: '#ec4899', // pink
}

const TOP_N = 5
const PAGE_SIZE = 10 // 표 클라이언트 페이징 페이지 크기

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

/** 레벨 도넛 팔레트(sky 계열, 카드 .game-tag-level 색과 통일), 스킬은 violet 계열 */
const LEVEL_COLORS = ['#0ea5e9', '#38bdf8', '#0284c7', '#7dd3fc', '#0369a1', '#bae6fd']
const SKILL_COLORS = ['#8b5cf6', '#a78bfa', '#7c3aed', '#c4b5fd', '#6d28d9', '#ddd6fe']
const NONE_COLOR = '#cbd5e1' // 미분류 = slate-300

/** 레벨/스킬 구성 도넛 — contentCount 분포. 종류 분포 도넛과 동일 패턴 */
function BreakdownDonut({
  title,
  rows,
  colors,
}: {
  title: string
  rows: BreakdownRow[]
  colors: string[]
}) {
  const data = rows.filter((r) => r.contentCount > 0)
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <h2 className="mb-3 text-lg font-bold text-gray-900">{title}</h2>
      {data.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
          아직 집계된 데이터가 없습니다.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="contentCount"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
            >
              {data.map((d, i) => (
                <Cell key={d.key} fill={d.key === '__none__' ? NONE_COLOR : colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value}개`, name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

/** 레벨/스킬 플레이·완료 막대 — 학습자 BarChart 패턴 복제(2계열) */
function BreakdownBars({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  const data = rows.filter((r) => r.plays > 0 || r.completions > 0)
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <h2 className="mb-3 text-lg font-bold text-gray-900">{title}</h2>
      {data.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
          아직 플레이 기록이 없습니다.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={32} />
            <Tooltip />
            <Legend />
            <Bar dataKey="plays" name="플레이" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            <Bar dataKey="completions" name="완료" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

/** 플레이 수 → 히트맵 셀 배경/글자색. 값이 클수록 진한 sky. 0이면 색 없음. */
function heatStyle(plays: number, max: number): CSSProperties {
  if (plays <= 0 || max <= 0) return {}
  const alpha = 0.15 + 0.85 * (plays / max)
  return { backgroundColor: `rgba(14, 165, 233, ${alpha})`, color: alpha > 0.55 ? '#fff' : '#0f172a' }
}

/** 레벨×스킬 교차 히트맵 — 행=레벨, 열=스킬, 셀 색 농도=플레이 수. 순서는 byLevel/bySkill(플레이 desc). */
function LevelSkillHeatmap({ data }: { data: StatsBreakdownOut | undefined }) {
  const cells = data?.byLevelSkill ?? []
  const levels = data?.byLevel ?? [] // 행 순서
  const skills = data?.bySkill ?? [] // 열 순서
  const cellMap = new Map(cells.map((c) => [`${c.levelKey}__${c.skillKey}`, c]))
  const max = cells.reduce((m, c) => Math.max(m, c.plays), 0)

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <h2 className="mb-3 text-lg font-bold text-gray-900">레벨 × 스킬 매핑 (플레이 수)</h2>
      {cells.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
          아직 집계된 데이터가 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-400">
                  레벨 \ 스킬
                </th>
                {skills.map((s) => (
                  <th key={s.key} className="px-2 py-1.5 text-center text-xs font-semibold text-gray-500">
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
                        className="rounded-lg px-2 py-2 text-center text-xs font-semibold tabular-nums"
                        style={heatStyle(plays, max)}
                        title={
                          c
                            ? `${lv.label} · ${s.label} — 플레이 ${c.plays} · 완료 ${c.completions} · 콘텐츠 ${c.contentCount}개`
                            : `${lv.label} · ${s.label} — 없음`
                        }
                      >
                        {plays > 0 ? plays : c && c.contentCount > 0 ? '·' : ''}
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
      .map(([kind, value]) => ({ kind, name: KIND_FILTER_LABEL[kind], value, color: KIND_COLOR[kind] }))
  }, [contents])

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

  const s = summary.data
  const hasError =
    summary.isError ||
    trends.isError ||
    learners.isError ||
    contentsError ||
    sessionsError ||
    breakdown.isError

  return (
    <main className="stats-page mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">통계 대시보드</h1>
        <p className="mt-0.5 text-sm text-gray-400">
          학습자 참여와 콘텐츠 사용 현황을 한눈에 봅니다
        </p>
      </header>

      {hasError && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          일부 통계를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      )}

      {/* ① KPI 요약 카드 */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard label="총 플레이" value={s ? s.totalPlays.toLocaleString() : '—'} />
        <StatCard label="활성 학습자" value={s ? s.activeLearners.toLocaleString() : '—'} />
        <StatCard
          label="실시간 접속"
          value={s ? s.activeNow : '—'}
          accent={s && s.activeNow > 0 ? 'text-emerald-600' : undefined}
          hint="최근 5분"
        />
        <StatCard label="전체 완료율" value={s ? pct(s.overallCompletionRate) : '—'} />
        <StatCard label="평균 체류" value={s ? formatDuration(s.avgDurationSeconds) : '—'} />
        <StatCard label="플레이된 콘텐츠" value={s ? s.distinctContent.toLocaleString() : '—'} />
        <StatCard
          label="평균 별점"
          value={s && s.avgRating != null ? `★ ${s.avgRating.toFixed(1)}` : '—'}
          accent="text-amber-500"
        />
        <StatCard label="총 평가 수" value={s ? s.totalRatings.toLocaleString() : '—'} />
      </section>

      {/* ② 차트 — 플레이 추이 + 종류 분포 */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <h2 className="mb-3 text-lg font-bold text-gray-900">플레이 추이 (최근 30일)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trends.data ?? []} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} minTickGap={24} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={32} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="plays" name="플레이" stroke="#0ea5e9" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="completions" name="완료" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-card">
          <h2 className="mb-3 text-lg font-bold text-gray-900">콘텐츠 종류 분포</h2>
          {kindData.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
              아직 집계된 데이터가 없습니다.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={kindData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {kindData.map((d) => (
                    <Cell key={d.kind} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}회`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* ②-b 레벨·스킬 분석 — 구성(도넛) + 플레이·완료(막대) */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BreakdownDonut
          title="레벨별 콘텐츠 구성"
          rows={breakdown.data?.byLevel ?? []}
          colors={LEVEL_COLORS}
        />
        <BreakdownBars title="레벨별 플레이·완료" rows={breakdown.data?.byLevel ?? []} />
        <BreakdownDonut
          title="스킬별 콘텐츠 구성"
          rows={breakdown.data?.bySkill ?? []}
          colors={SKILL_COLORS}
        />
        <BreakdownBars title="스킬별 플레이·완료" rows={breakdown.data?.bySkill ?? []} />
      </section>

      {/* ②-c 레벨 × 스킬 매핑 히트맵 */}
      <section>
        <LevelSkillHeatmap data={breakdown.data} />
      </section>

      {/* ③ 학습자 참여도 — 표 + 막대 */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-bold text-gray-900">학습자 참여도</h2>
          <div className="overflow-x-auto rounded-2xl bg-white shadow-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">학습자</th>
                  <th className="px-4 py-3 font-semibold">플레이</th>
                  <th className="px-4 py-3 font-semibold">콘텐츠</th>
                  <th className="px-4 py-3 font-semibold">완료율</th>
                  <th className="px-4 py-3 font-semibold">총 체류</th>
                  <th className="px-4 py-3 font-semibold">평가</th>
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
                    <td className="px-4 py-3 text-gray-400">
                      {(learnersPaged.page - 1) * PAGE_SIZE + i + 1}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{l.userName}</td>
                    <td className="px-4 py-3 text-gray-600">{l.plays}</td>
                    <td className="px-4 py-3 text-gray-600">{l.distinctContent}</td>
                    <td className="px-4 py-3 text-gray-600">{pct(l.completionRate)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatLongDuration(l.totalDurationSeconds)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{l.ratingsGiven}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={learnersPaged.page}
            pageCount={learnersPaged.pageCount}
            onChange={learnersPaged.setPage}
          />
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-card">
          <h2 className="mb-3 text-lg font-bold text-gray-900">학습자별 플레이 수</h2>
          {learners.data && learners.data.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
              아직 학습자 활동이 없습니다.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topLearners} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="userName" tick={{ fontSize: 11 }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={32} />
                <Tooltip />
                <Bar dataKey="plays" name="플레이" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* ④ 품질 리스트 — 인기 Top-N + 저평점 주의 */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <h2 className="mb-3 text-lg font-bold text-gray-900">인기 Top {TOP_N}</h2>
          {topByUses.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">아직 플레이 기록이 없습니다.</p>
          ) : (
            <ol className="space-y-2">
              {topByUses.map((c, i) => (
                <li key={c.contentId} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 truncate">
                    <span className="w-5 shrink-0 text-gray-400">{i + 1}</span>
                    <span className="truncate font-semibold text-gray-800">{c.title}</span>
                  </span>
                  <span className="shrink-0 text-gray-500">{c.uses}회</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-card">
          <h2 className="mb-3 text-lg font-bold text-gray-900">저평점 주의</h2>
          {lowRated.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">아직 평가 데이터가 없습니다.</p>
          ) : (
            <ol className="space-y-2">
              {lowRated.map((c, i) => (
                <li key={c.contentId} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 truncate">
                    <span className="w-5 shrink-0 text-gray-400">{i + 1}</span>
                    <span className="truncate font-semibold text-gray-800">{c.title}</span>
                  </span>
                  <span className="shrink-0 text-red-500">
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
        <h2 className="mb-3 text-lg font-bold text-gray-900">콘텐츠별 통계</h2>
        <div className="overflow-x-auto rounded-2xl bg-white shadow-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
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
                    <td className="px-4 py-3 font-semibold text-gray-800">{c.title}</td>
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
                        <span className="text-amber-500">
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
        <Pagination
          page={contentsPaged.page}
          pageCount={contentsPaged.pageCount}
          onChange={contentsPaged.setPage}
        />
      </section>

      {/* ⑥ 최근 세션 */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-900">최근 세션</h2>
        <div className="overflow-x-auto rounded-2xl bg-white shadow-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
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
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
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
        <Pagination
          page={sessionsPaged.page}
          pageCount={sessionsPaged.pageCount}
          onChange={sessionsPaged.setPage}
        />
      </section>
    </main>
  )
}
