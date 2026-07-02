import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { ContentStats, RecentSession } from '../api/types'
import { KindBadge } from '../components/GameCard'

/** mm:ss 형식 체류시간 포맷 */
function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}

/** §16 통계 페이지 (관리자 전용) — 콘텐츠별 집계 + 최근 세션 */
export function StatsPage() {
  const { data: contents, isLoading: contentsLoading } = useQuery<ContentStats[]>({
    queryKey: ['stats', 'contents'],
    queryFn: () => api.get<ContentStats[]>('/api/stats/contents'),
  })

  const { data: sessions, isLoading: sessionsLoading } = useQuery<RecentSession[]>({
    queryKey: ['stats', 'sessions'],
    queryFn: () => api.get<RecentSession[]>('/api/stats/sessions?limit=50'),
  })

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-900">콘텐츠별 통계</h2>
        <div className="overflow-x-auto rounded-2xl bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                <th className="px-4 py-3 font-semibold">콘텐츠</th>
                <th className="px-4 py-3 font-semibold">종류</th>
                <th className="px-4 py-3 font-semibold">플레이 수</th>
                <th className="px-4 py-3 font-semibold">완료 수</th>
                <th className="px-4 py-3 font-semibold">완료율</th>
                <th className="px-4 py-3 font-semibold">평균 체류</th>
                <th className="px-4 py-3 font-semibold">마지막 플레이</th>
              </tr>
            </thead>
            <tbody>
              {contentsLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    불러오는 중…
                  </td>
                </tr>
              )}
              {contents && contents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    아직 집계된 데이터가 없습니다.
                  </td>
                </tr>
              )}
              {contents?.map((c) => {
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
                    <td className="px-4 py-3 text-gray-600">{formatDuration(c.avgDurationSeconds)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDateTime(c.lastPlayedAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-900">최근 세션</h2>
        <div className="overflow-x-auto rounded-2xl bg-white shadow-card">
          <table className="w-full text-sm">
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
              {sessions?.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 font-semibold text-gray-800">{s.userName}</td>
                  <td className="px-4 py-3 text-gray-600">{s.title}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDateTime(s.startedAt)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDuration(s.durationSeconds)}</td>
                  <td className="px-4 py-3">{s.completed ? '✓' : '—'}</td>
                  <td className="px-4 py-3">
                    {s.open ? (
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
      </section>
    </main>
  )
}
