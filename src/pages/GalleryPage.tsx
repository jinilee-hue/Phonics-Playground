import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import type { GalleryOut } from '../api/types'
import { GameCard } from '../components/GameCard'
import { PlayModal } from '../components/PlayModal'

/** 뷰포트 폭 → 한 페이지에 꽉 보이는 열 수. index.css .gallery-track 브레이크포인트와 일치. */
function computeColumns(): number {
  if (typeof window === 'undefined') return 4
  const w = window.innerWidth
  if (w >= 1760) return 6
  if (w >= 1440) return 5
  if (w >= 1000) return 4
  if (w >= 640) return 2
  return 1
}

function useColumns(): number {
  const [cols, setCols] = useState(computeColumns)
  useEffect(() => {
    const onResize = () => setCols(computeColumns())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return cols
}

/** §6 갤러리 — 페이지 캐러셀(각 페이지 첫 카드 좌측 정렬 + 다음 카드 peek), 레벨 필터(TopBar, URL ?level) */
export function GalleryPage() {
  const [searchParams] = useSearchParams()
  const [activeId, setActiveId] = useState<number | null>(null)
  const [page, setPage] = useState(0)

  const { data, error, isLoading, refetch, isFetching } = useQuery<GalleryOut>({
    queryKey: ['gallery'],
    queryFn: () => api.get<GalleryOut>('/api/gallery'),
  })

  const items = data?.items ?? []
  const level = searchParams.get('level') ?? ''
  const filtered = items.filter((item) => level === '' || item.courseCode === level)
  const activeItem = activeId != null ? items.find((i) => i.id === activeId) ?? null : null

  // 캐러셀 계산 — 2행이므로 열 개수 = ceil(항목/2). 한 페이지 = perPage(열) × 2행.
  const perPage = useColumns()
  const numCols = Math.ceil(filtered.length / 2)
  const pageCount = Math.max(1, Math.ceil(numCols / perPage))
  const safePage = Math.min(page, pageCount - 1)

  // 레벨 필터가 바뀌면 첫 페이지로.
  useEffect(() => setPage(0), [level])

  // 열 1개 폭(카드폭 + gap)을 실측 → 정확한 px 이동량 계산(마지막 페이지도 좌측 정렬).
  const trackRef = useRef<HTMLDivElement>(null)
  const [stride, setStride] = useState(0)
  useEffect(() => {
    const measure = () => {
      const track = trackRef.current
      const cell = track?.firstElementChild as HTMLElement | null
      if (!track || !cell) return
      const gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0
      setStride(cell.offsetWidth + gap)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [filtered.length, perPage])

  const goTo = (p: number) => setPage(Math.min(Math.max(p, 0), pageCount - 1))

  // 터치 기기: 좌우 스와이프로 페이지 이동(가로 이동 50px 이상).
  const touchStartX = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) > 50) goTo(safePage + (dx < 0 ? 1 : -1))
  }

  const offset = safePage * perPage * stride

  return (
    <main className="gallery-page">
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
        <p className="py-16 text-center text-gray-400">선택한 레벨에 해당하는 게임이 없습니다.</p>
      )}

      {filtered.length > 0 && (
        <div className="gallery-viewport" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div
            ref={trackRef}
            className="gallery-track"
            style={{ transform: `translateX(${-offset}px)` }}
          >
            {filtered.map((item) => (
              <div className="gallery-cell" key={item.id}>
                <GameCard item={item} onPlay={(it) => setActiveId(it.id)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="gallery-footerbar">
          <div className="gallery-footer-text">
            <p className="app-footer-notice">본 콘텐츠는 AI가 생성한 내용을 포함하고 있습니다.</p>
            <p className="app-footer-copy">COPYRIGHT © 2026 Poly Inspiration. ALL RIGHTS RESERVED.</p>
          </div>

          {pageCount > 1 && (
            <div className="gallery-pager">
              <button
                type="button"
                className="gallery-nav"
                onClick={() => goTo(safePage - 1)}
                disabled={safePage === 0}
                aria-label="이전"
              >
                ‹
              </button>
              <div className="gallery-dots" role="tablist" aria-label="페이지">
                {Array.from({ length: pageCount }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === safePage}
                    aria-label={`${i + 1}페이지`}
                    className={`gallery-dot${i === safePage ? ' is-active' : ''}`}
                    onClick={() => goTo(i)}
                  >
                    P{i + 1}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="gallery-nav"
                onClick={() => goTo(safePage + 1)}
                disabled={safePage >= pageCount - 1}
                aria-label="다음"
              >
                ›
              </button>
            </div>
          )}
        </div>
      )}

      {isFetching && !isLoading && <p className="mt-4 text-center text-xs text-gray-400">갱신 중…</p>}

      {activeItem && <PlayModal item={activeItem} onClose={() => setActiveId(null)} />}
    </main>
  )
}
