import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api, ApiError } from '../api/client'
import type { GalleryOut } from '../api/types'
import { GameCard } from '../components/GameCard'
import { PlayModal } from '../components/PlayModal'

/** §6 갤러리 — 스튜디오 카탈로그 연동, stale/오류 상태를 배너로 안내, 제목 검색(클라이언트 필터) */
export function GalleryPage() {
  const [query, setQuery] = useState('')
  // 열린 플레이 모달의 콘텐츠 id(null이면 닫힘). 스냅샷이 아니라 id만 들고 아래에서
  // ['gallery'] 캐시의 최신 item을 찾아 넘긴다 → 별점 낙관적 갱신이 모달에도 즉시 반영된다.
  const [activeId, setActiveId] = useState<number | null>(null)

  const { data, error, isLoading, refetch, isFetching } = useQuery<GalleryOut>({
    queryKey: ['gallery'],
    queryFn: () => api.get<GalleryOut>('/api/gallery'),
  })

  const q = query.trim().toLowerCase()
  const filtered = data?.items.filter((item) => item.title.toLowerCase().includes(q)) ?? []
  const activeItem = activeId != null ? data?.items.find((i) => i.id === activeId) ?? null : null

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
        <p className="py-16 text-center text-gray-400">'{query.trim()}'에 해당하는 게임이 없습니다.</p>
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
