import { lazy, Suspense, useEffect } from 'react'
import { useT } from '../i18n'

// 통계 화면은 recharts를 포함(무거움) → 모달 열 때만 로드(코드 스플릿, /stats 라우트와 동일 청크)
const StatsPage = lazy(() => import('../pages/StatsPage').then((m) => ({ default: m.StatsPage })))

/** 리스트형에서 통계를 라우트 이동 없이 모달로 띄운다. */
export function StatsModal({ onClose }: { onClose: () => void }) {
  const t = useT()

  // Esc 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="stats-modal-overlay" onClick={onClose}>
      <div
        className="stats-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('nav.stats')}
      >
        {/* 타이틀·서브문구는 고정 — 스크롤 영역은 이 아래부터 시작 */}
        <header className="stats-modal-head">
          <div>
            <h2>통계 대시보드</h2>
            <p>학습자 참여와 콘텐츠 사용 현황을 한눈에 봅니다</p>
          </div>
          <button
            type="button"
            className="stats-modal-close"
            onClick={onClose}
            aria-label={t('settings.close')}
          >
            ✕
          </button>
        </header>
        <div className="stats-modal-body">
          <Suspense
            fallback={<p className="py-16 text-center text-gray-400">{t('gallery.loading')}</p>}
          >
            <StatsPage />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
