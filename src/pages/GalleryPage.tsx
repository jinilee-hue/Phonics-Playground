import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api, ApiError } from '../api/client'
import type { GalleryOut, Kind } from '../api/types'
import { GameCard, KIND_FILTER_LABEL } from '../components/GameCard'
import { PlayModal } from '../components/PlayModal'

/** Set에서 값을 토글해 새 Set을 반환(다중 선택 필터용). */
function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set)
  next.has(value) ? next.delete(value) : next.add(value)
  return next
}

/** §6 갤러리 — 스튜디오 카탈로그 연동, stale/오류 상태를 배너로 안내, 제목 검색 + 형식·레벨 다중 필터 */
export function GalleryPage() {
  const [query, setQuery] = useState('')
  // 다중 선택 필터. 빈 Set이면 필터 미적용(전체 노출). 카테고리 간 AND, 카테고리 내 OR.
  const [kinds, setKinds] = useState<Set<Kind>>(new Set())
  const [levels, setLevels] = useState<Set<string>>(new Set())
  // 열린 플레이 모달의 콘텐츠 id(null이면 닫힘). 스냅샷이 아니라 id만 들고 아래에서
  // ['gallery'] 캐시의 최신 item을 찾아 넘긴다 → 별점 낙관적 갱신이 모달에도 즉시 반영된다.
  const [activeId, setActiveId] = useState<number | null>(null)

  const { data, error, isLoading, refetch, isFetching } = useQuery<GalleryOut>({
    queryKey: ['gallery'],
    queryFn: () => api.get<GalleryOut>('/api/gallery'),
  })

  const items = data?.items ?? []
  // 필터 옵션은 실제 로드된 데이터에서 동적 산출(하드코딩 금지) — 존재하는 값만 칩으로 노출.
  // items가 바뀔 때만 재계산(검색어 타이핑마다 Set 재생성/정렬 방지).
  const availableKinds = useMemo(() => [...new Set(items.map((i) => i.kind))], [items])
  const availableLevels = useMemo(
    () => [...new Set(items.map((i) => i.courseCode).filter((c): c is string => !!c))].sort(),
    [items],
  )

  const q = query.trim().toLowerCase()
  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(q) &&
      (kinds.size === 0 || kinds.has(item.kind)) &&
      (levels.size === 0 || (item.courseCode != null && levels.has(item.courseCode))),
  )
  const activeItem = activeId != null ? items.find((i) => i.id === activeId) ?? null : null

  return (
    <main className="gallery-page">
      <header className="gallery-page-header">
        <div>
          <h1>갤러리</h1>
          <p>게시된 파닉스 게임을 골라 플레이해보세요.</p>
        </div>
        {data && data.items.length > 0 && (
          <span className="gallery-count">{filtered.length}개 게임</span>
        )}
      </header>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="게임 제목 검색"
        aria-label="게임 제목 검색"
        className="gallery-search"
      />

      {(availableKinds.length > 0 || availableLevels.length > 0) && (
        <div className="gallery-filters">
          {availableKinds.length > 0 && (
            <div className="gallery-filter-row" role="group" aria-label="형식 필터">
              <span className="gallery-filter-label">형식</span>
              {availableKinds.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={kinds.has(kind)}
                  onClick={() => setKinds((prev) => toggle(prev, kind))}
                  className={`gallery-filter-chip${kinds.has(kind) ? ' is-active' : ''}`}
                >
                  {KIND_FILTER_LABEL[kind]}
                </button>
              ))}
            </div>
          )}
          {availableLevels.length > 0 && (
            <div className="gallery-filter-row" role="group" aria-label="레벨 필터">
              <span className="gallery-filter-label">레벨</span>
              {availableLevels.map((level) => (
                <button
                  key={level}
                  type="button"
                  aria-pressed={levels.has(level)}
                  onClick={() => setLevels((prev) => toggle(prev, level))}
                  className={`gallery-filter-chip${levels.has(level) ? ' is-active' : ''}`}
                >
                  {level}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {data?.stale && (
        <div className="mb-4 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          스튜디오 연결이 원활하지 않아 마지막으로 확인된 목록을 보여줍니다.
        </div>
      )}

      {error instanceof ApiError && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
          <span>{error.message}</span>
          <button
            onClick={() => refetch()}
            className="ml-3 shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      )}

      {isLoading && <p className="py-16 text-center text-gray-400">불러오는 중…</p>}

      {data && data.items.length === 0 && (
        <p className="py-16 text-center text-gray-400">아직 게시된 콘텐츠가 없습니다.</p>
      )}

      {data && data.items.length > 0 && filtered.length === 0 && (
        <p className="py-16 text-center text-gray-400">
          {query.trim()
            ? `'${query.trim()}'에 해당하는 게임이 없습니다.`
            : '선택한 조건에 해당하는 게임이 없습니다.'}
        </p>
      )}

      {filtered.length > 0 && (
        <div className="gallery-grid">
          {filtered.map((item) => (
            <GameCard key={item.id} item={item} onPlay={(it) => setActiveId(it.id)} />
          ))}
        </div>
      )}

      {isFetching && !isLoading && <p className="mt-4 text-center text-xs text-gray-400">갱신 중…</p>}

      {activeItem && <PlayModal item={activeItem} onClose={() => setActiveId(null)} />}
    </main>
  )
}
