import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { GalleryItem } from '../api/types'
import { useT } from '../i18n'
import { PlayCard } from './GameCard'

/**
 * "영역별 맞춤 파닉스 놀이" 가로 레일 — 레벨 탭(전체 레벨·ECP1…) + 한 줄 가로 스크롤.
 *
 * 무한 루프: 목록이 넘칠 때 카드를 3벌 복제해 렌더하고 스크롤을 항상 가운데 벌에 둔다.
 * 스크롤이 멈추면(‹›/스와이프 모두) 위치를 한 벌 폭만큼 순간 이동해 가운데로 되돌린다 —
 * 세 벌이 동일해 이음매가 보이지 않으므로 끝↔처음이 자연스럽게 연결된다. 태블릿은 좌우 스와이프.
 */
export function PlayRail({
  title,
  subtitle,
  items,
  levels,
  activeLevel,
  onLevel,
  onPlay,
}: {
  title: string
  subtitle: string
  items: GalleryItem[]
  levels: string[]
  activeLevel: string
  onLevel: (value: string) => void
  onPlay: (item: GalleryItem) => void
}) {
  const t = useT()
  const railRef = useRef<HTMLDivElement>(null)
  const [overflowing, setOverflowing] = useState(false)

  const copyWidthRef = useRef(0) // 카드 한 벌(복제 1세트)의 스크롤 폭
  const loopRef = useRef(false) // 스크롤 핸들러에서 최신 loop 값 참조용
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const loop = overflowing
  loopRef.current = loop

  // 카드 한 벌 폭 측정 + 넘침 여부 판정. 복제본이 있으면 두 벌 사이 간격으로 정확히 산출.
  const measure = useCallback(() => {
    const el = railRef.current
    if (!el) return
    const kids = el.children
    const n = items.length
    if (n === 0 || kids.length === 0) {
      copyWidthRef.current = 0
      setOverflowing(false)
      return
    }
    let single: number
    if (kids.length >= 2 * n) {
      // 3벌 렌더 상태 — 두 번째 벌 첫 카드 offset - 첫 벌 첫 카드 offset = 한 벌 폭
      single = (kids[n] as HTMLElement).offsetLeft - (kids[0] as HTMLElement).offsetLeft
    } else {
      // 1벌만 렌더 — 마지막 카드 우측 - 첫 카드 좌측(마지막 간격 제외, 넘침 판정엔 충분)
      const last = kids[kids.length - 1] as HTMLElement
      single = last.offsetLeft + last.offsetWidth - (kids[0] as HTMLElement).offsetLeft
    }
    copyWidthRef.current = single
    setOverflowing(single > el.clientWidth + 4)
  }, [items.length])

  // 측정 후 loop면 가운데 벌로 스크롤 위치를 옮긴다(플래시 방지 위해 paint 전에).
  const layout = useCallback(() => {
    const el = railRef.current
    if (!el) return
    measure()
    el.scrollLeft = loopRef.current && copyWidthRef.current > 0 ? copyWidthRef.current : 0
  }, [measure])

  // 목록/레벨/loop 변경 시 재측정·재배치. loop가 바뀌면(복제본 수 변화) 다시 실행돼 수렴.
  useLayoutEffect(() => {
    const raf = requestAnimationFrame(layout)
    window.addEventListener('resize', layout)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', layout)
    }
  }, [layout, loop, items.length, activeLevel])

  // 스크롤이 멈추면 가운데 벌 범위[w, 2w)로 순간 정규화 → 끝/처음이 이어져 보임(복제본 동일).
  useEffect(() => {
    const el = railRef.current
    if (!el) return
    const normalize = () => {
      if (!loopRef.current) return
      const w = copyWidthRef.current
      if (w <= 0) return
      let x = el.scrollLeft
      if (x >= 2 * w) x -= w
      else if (x < w) x += w
      if (x !== el.scrollLeft) el.scrollLeft = x // 즉시(비애니메이션) — 눈에 안 띔
    }
    const onScroll = () => {
      clearTimeout(settleTimer.current)
      settleTimer.current = setTimeout(normalize, 120)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      clearTimeout(settleTimer.current)
    }
  }, [])

  // ‹ › 이동 — 한 화면의 90%씩. 멈추면 위 정규화가 가운데로 되돌려 무한 루프처럼 이어진다.
  const move = (dir: 1 | -1) => {
    const el = railRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  const rendered = loop ? [0, 1, 2].flatMap((c) => items.map((item) => ({ item, c }))) : items.map((item) => ({ item, c: 0 }))

  return (
    <section className="dash-section dash-section-bleed">
      <header className="dash-head dash-head-rail">
        <div className="dash-head-top">
          <div className="dash-head-text">
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>

          {overflowing && (
            <div className="dash-rail-nav">
              <button
                type="button"
                className="gallery-nav"
                onClick={() => move(-1)}
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
              <button
                type="button"
                className="gallery-nav"
                onClick={() => move(1)}
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

        {levels.length > 0 && (
          <div className="dash-tabs" role="tablist" aria-label={t('topbar.levelFilter')}>
            <button
              type="button"
              role="tab"
              aria-selected={activeLevel === ''}
              className={`dash-tab${activeLevel === '' ? ' is-active' : ''}`}
              onClick={() => onLevel('')}
            >
              {t('level.all')}
            </button>
            {levels.map((lv) => (
              <button
                key={lv}
                type="button"
                role="tab"
                aria-selected={activeLevel === lv}
                className={`dash-tab${activeLevel === lv ? ' is-active' : ''}`}
                onClick={() => onLevel(lv)}
              >
                {lv}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="dash-rail" ref={railRef}>
        {rendered.map(({ item, c }) => (
          <PlayCard key={`${c}-${item.id}`} item={item} onPlay={onPlay} />
        ))}
      </div>
    </section>
  )
}
