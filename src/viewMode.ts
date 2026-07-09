import { useEffect, useState } from 'react'

/** 갤러리 표시 형태 — 카드형(gallery) / 리스트형(list). 설정 팝업에서 전환, localStorage 'viewMode' 저장. */
export type ViewMode = 'gallery' | 'list'

export function getViewMode(): ViewMode {
  return typeof window !== 'undefined' && localStorage.getItem('viewMode') === 'list'
    ? 'list'
    : 'gallery'
}

export function setViewMode(mode: ViewMode): void {
  localStorage.setItem('viewMode', mode)
  window.dispatchEvent(new Event('viewmodechange'))
}

/** 현재 뷰 모드를 반환하고, 변경 시 리렌더한다. */
export function useViewMode(): ViewMode {
  const [mode, setMode] = useState<ViewMode>(getViewMode)
  useEffect(() => {
    const onChange = () => setMode(getViewMode())
    window.addEventListener('viewmodechange', onChange)
    window.addEventListener('storage', onChange) // 다른 탭 동기화
    return () => {
      window.removeEventListener('viewmodechange', onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])
  return mode
}
