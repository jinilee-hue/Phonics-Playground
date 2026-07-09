import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import type { GalleryOut } from '../api/types'
import { EventBanner, GameCard, RankRow } from '../components/GameCard'
import { PlayRail } from '../components/PlayRail'
import { PlayModal } from '../components/PlayModal'
import { useT } from '../i18n'
import { useViewMode } from '../viewMode'
import { CharacterSprite } from '../components/CharacterSprite'
import heroVideo from '../assets/login_bg.mp4'
import promoDecor from '../assets/promo-decor.png'
import logoUrl from '../assets/logo.png'

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

/**
 * 페이지(perPage열 × 2행) 단위로 "행 우선"(윗줄을 가로로 먼저 채우고 아랫줄) 배치용으로 재배열한다.
 * 그리드가 열 우선(grid-auto-flow: column, 2행)이라 열마다 [윗줄, 아랫줄] 순으로 넣는다.
 * 윗줄은 perPage 열까지 먼저 채우고, 해당 열의 아랫줄이 비면 null(빈 칸)을 넣어
 * 다음 카드가 아래가 아닌 옆 열로 가도록 한다(예: 2개면 윗줄에 가로로 나란히).
 */
function toRowMajorOrder<T>(items: T[], perPage: number): (T | null)[] {
  const cols = Math.max(1, perPage)
  const pageSize = cols * 2
  const out: (T | null)[] = []
  for (let p = 0; p < items.length; p += pageSize) {
    const page = items.slice(p, p + pageSize)
    const top = page.slice(0, cols)
    const bottom = page.slice(cols)
    for (let c = 0; c < top.length; c++) {
      out.push(top[c]) // 윗줄
      out.push(c < bottom.length ? bottom[c] : null) // 아랫줄(없으면 빈 칸)
    }
  }
  return out
}

/** §6 갤러리 — 페이지 캐러셀(각 페이지 첫 카드 좌측 정렬 + 다음 카드 peek), 레벨 필터(TopBar, URL ?level) */
export function GalleryPage() {
  const t = useT()
  const viewMode = useViewMode()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeId, setActiveId] = useState<number | null>(null)
  const [page, setPage] = useState(0)

  // URL 쿼리 하나 갱신(빈 값이면 제거) — TopBar와 상태 공유(레벨 탭에서 사용)
  const setParam = (key: string, value: string) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        value ? next.set(key, value) : next.delete(key)
        return next
      },
      { replace: true },
    )

  const { data, error, isLoading, refetch, isFetching } = useQuery<GalleryOut>({
    queryKey: ['gallery'],
    queryFn: () => api.get<GalleryOut>('/api/gallery'),
  })

  const items = data?.items ?? []
  const level = searchParams.get('level') ?? ''
  const skill = searchParams.get('skill') ?? ''
  const filtered = items.filter(
    (item) =>
      (level === '' || item.courseCode === level) && (skill === '' || item.skillLabel === skill),
  )
  // 레벨 탭 옵션(ECP1…) — 갤러리 데이터의 courseCode에서 산출
  const levels = [
    ...new Set(items.map((i) => i.courseCode).filter((c): c is string => !!c)),
  ].sort()
  const activeItem = activeId != null ? items.find((i) => i.id === activeId) ?? null : null

  // 캐러셀 계산 — 2행이므로 열 개수 = ceil(항목/2). 한 페이지 = perPage(열) × 2행.
  const perPage = useColumns()
  const numCols = Math.ceil(filtered.length / 2)
  const pageCount = Math.max(1, Math.ceil(numCols / perPage))

  // 카드형 페이저(리스트형은 세로 스크롤 대시보드라 페이징 없음)
  const effectivePageCount = pageCount
  const safePage = Math.min(page, effectivePageCount - 1)

  // 리스트형 대시보드 데이터 — 신규 배너 3종 / 영역별 카드 그리드(전체) / 인기 랭킹 / 최근 플레이
  const newItems = filtered.slice(0, 3)
  const ranking = [...filtered].sort((a, b) => b.uses - a.uses).slice(0, 5)
  const recent = filtered.slice(0, 5) // 디자인 모드 — 실제 플레이 기록이 없어 목업
  const rankTone = (i: number): 'gold' | 'silver' | 'bronze' | 'sky' =>
    i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'sky'

  // 레벨·학습종류·뷰모드가 바뀌면 첫 페이지로.
  useEffect(() => setPage(0), [level, skill, viewMode])

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

  const goTo = (p: number) => setPage(Math.min(Math.max(p, 0), effectivePageCount - 1))

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
  // 윗줄(가로)부터 채우고 아랫줄로 이어지도록 페이지 단위 재배열
  const displayItems = toRowMajorOrder(filtered, perPage)

  return (
    <main className={`gallery-page${viewMode === 'list' ? ' gallery-page-list' : ''}`}>
      {data?.stale && (
        <div className="mb-4 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          {t('gallery.stale')}
        </div>
      )}

      {error instanceof ApiError && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
          <span>{error.message}</span>
          <button
            onClick={() => refetch()}
            className="ml-3 shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            {t('gallery.retry')}
          </button>
        </div>
      )}

      {isLoading && <p className="py-16 text-center text-gray-400">{t('gallery.loading')}</p>}

      {data && data.items.length === 0 && (
        <p className="py-16 text-center text-gray-400">{t('gallery.empty')}</p>
      )}

      {data && data.items.length > 0 && filtered.length === 0 && (
        <p className="py-16 text-center text-gray-400">{t('gallery.noLevel')}</p>
      )}

      {/* 리스트형 — 세로 스크롤 대시보드(신규 배너 · 영역별 카드 그리드 · 인기 랭킹 · 최근 플레이) */}
      {filtered.length > 0 && viewMode === 'list' && (
        <div className="gallery-dash">
          {/* Figma 상단 히어로 — 일러스트 배경 + 헤드라인 + 캐릭터/로고 */}
          <div className="dash-hero">
            <video
              className="dash-hero-bg"
              src={heroVideo}
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
            />
            <span className="dash-hero-scrim" aria-hidden="true" />
            <CharacterSprite className="dash-hero-chars" />
            <div className="dash-hero-copy">
              <img src={logoUrl} alt="POLY Phonics" className="dash-hero-logo" />
              <h1>{t('hero.title')}</h1>
              <p>{t('hero.sub')}</p>
              <button
                type="button"
                className="dash-hero-cta"
                onClick={() => newItems[0] && setActiveId(newItems[0].id)}
              >
                {t('hero.cta')}
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                  <path
                    d="M5 12h13M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          <section className="dash-section">
            <header className="dash-head">
              <h2>{t('dash.new.title')}</h2>
              <p>{t('dash.new.sub')}</p>
            </header>
            <div className="dash-banners">
              {newItems.map((item, i) => (
                <EventBanner
                  key={item.id}
                  item={item}
                  index={i}
                  onPlay={(it) => setActiveId(it.id)}
                />
              ))}
            </div>
          </section>

          <PlayRail
            title={t('dash.grid.title')}
            subtitle={t('dash.grid.sub')}
            items={filtered}
            levels={levels}
            activeLevel={level}
            onLevel={(v) => setParam('level', v)}
            onPlay={(it) => setActiveId(it.id)}
          />

          <div className="dash-columns">
            <section className="dash-section">
              <header className="dash-head">
                <h2>{t('dash.ranking.title')}</h2>
                <p>{t('dash.ranking.sub')}</p>
              </header>
              <div className="dash-list">
                {ranking.map((item, i) => (
                  <RankRow
                    key={item.id}
                    item={item}
                    rank={i + 1}
                    pillTone={rankTone(i)}
                    meta={t('dash.plays', { n: item.uses.toLocaleString() })}
                    rating={
                      item.ratingCount > 0 && item.ratingAvg != null ? item.ratingAvg : undefined
                    }
                    onPlay={(it) => setActiveId(it.id)}
                  />
                ))}
              </div>
            </section>

            <section className="dash-section">
              <header className="dash-head">
                <h2>{t('dash.recent.title')}</h2>
                <p>{t('dash.recent.sub')}</p>
              </header>
              <div className="dash-list">
                {recent.map((item, i) => (
                  <RankRow
                    key={item.id}
                    item={item}
                    meta={t('dash.lastPlayed', { t: t(`dash.time.${i}`) })}
                    onPlay={(it) => setActiveId(it.id)}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* 하단 프로모 배너 — Figma "POLY Phonics Games" */}
          <div className="dash-promo">
            <div className="dash-promo-copy">
              <h2>{t('promo.title')}</h2>
              <p>{t('promo.sub')}</p>
              <button
                type="button"
                className="dash-promo-cta"
                onClick={() => ranking[0] && setActiveId(ranking[0].id)}
              >
                {t('hero.cta')}
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                  <path
                    d="M5 12h13M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <img className="dash-promo-decor" src={promoDecor} alt="" />
          </div>
        </div>
      )}

      {/* 카드형 — 페이지 캐러셀 */}
      {filtered.length > 0 && viewMode === 'gallery' && (
        <div className="gallery-viewport" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div
            ref={trackRef}
            className="gallery-track"
            style={{ transform: `translateX(${-offset}px)` }}
          >
            {displayItems.map((item, i) =>
              item ? (
                <div className="gallery-cell" key={item.id}>
                  <GameCard item={item} onPlay={(it) => setActiveId(it.id)} />
                </div>
              ) : (
                // 아랫줄 빈 칸 — 그리드 열 정렬 유지용(다음 카드가 옆 열로 가도록)
                <div className="gallery-cell" key={`empty-${i}`} aria-hidden="true" />
              ),
            )}
          </div>
        </div>
      )}

      {filtered.length > 0 && viewMode === 'gallery' && (
        <div className="gallery-footerbar">
          <div className="gallery-footer-text">
            <p className="app-footer-notice">{t('footer.aiNotice')}</p>
            <p className="app-footer-copy">{t('footer.copyright')}</p>
          </div>

          {effectivePageCount > 1 && (
            <div className="gallery-pager">
              <button
                type="button"
                className="gallery-nav"
                onClick={() => goTo(safePage - 1)}
                disabled={safePage === 0}
                aria-label={t('gallery.prev')}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                  <path
                    d="M15 5l-7 7 7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div className="gallery-dots" role="tablist" aria-label={t('gallery.page', { n: '' })}>
                {Array.from({ length: effectivePageCount }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === safePage}
                    aria-label={t('gallery.page', { n: i + 1 })}
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
                disabled={safePage >= effectivePageCount - 1}
                aria-label={t('gallery.next')}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                  <path
                    d="M9 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {isFetching && !isLoading && (
        <p className="mt-4 text-center text-xs text-gray-400">{t('gallery.refreshing')}</p>
      )}

      {activeItem && <PlayModal item={activeItem} onClose={() => setActiveId(null)} />}
    </main>
  )
}
