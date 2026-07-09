import { useCallback, useEffect, useRef, useState } from 'react'
import type { GalleryItem } from '../api/types'
import { useT } from '../i18n'
import { PlayCard } from './GameCard'

/**
 * "영역별 맞춤 파닉스 놀이" 가로 레일 — 레벨 탭(전체 레벨·ECP1…) + 한 줄 가로 스크롤.
 * 헤더 우측 ‹ › 버튼은 끝에서 반대쪽으로 순환(루프)한다. 태블릿은 좌우 손가락 스와이프로 이동.
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

  const update = useCallback(() => {
    const el = railRef.current
    if (!el) return
    setOverflowing(el.scrollWidth > el.clientWidth + 4)
  }, [])

  useEffect(() => {
    const el = railRef.current
    if (!el) return
    // 레벨 탭이 바뀌면 목록이 바뀌므로 스크롤을 처음으로 되돌리고 재측정
    el.scrollLeft = 0
    const raf = requestAnimationFrame(update)
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', update)
    }
  }, [update, items.length, activeLevel])

  // ‹ › 이동 — 끝에 닿으면 반대쪽 끝으로 순환(무한 루프처럼 계속 넘길 수 있음)
  const move = (dir: 1 | -1) => {
    const el = railRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const step = el.clientWidth * 0.9
    if (dir === 1) {
      if (el.scrollLeft >= max - 4) el.scrollTo({ left: 0, behavior: 'smooth' })
      else el.scrollBy({ left: step, behavior: 'smooth' })
    } else {
      if (el.scrollLeft <= 4) el.scrollTo({ left: max, behavior: 'smooth' })
      else el.scrollBy({ left: -step, behavior: 'smooth' })
    }
  }

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
        {items.map((item) => (
          <PlayCard key={item.id} item={item} onPlay={onPlay} />
        ))}
      </div>
    </section>
  )
}
