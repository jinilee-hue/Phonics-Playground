import { useEffect, useRef, useState } from 'react'
import type { GalleryItem } from '../api/types'
import { GameReviewModal } from './GameReviewModal'
import { isGameEvent } from '../play/protocol'
import { usePlaySession } from '../play/usePlaySession'

/** 외부 URL을 iframe에 임베드 가능한 형태로 변환한다.
 * YouTube/Vimeo는 전용 embed URL로 바꾼다(watch URL은 X-Frame-Options로 임베드 불가).
 * 그 외 URL은 그대로 시도한다(프레이밍 허용 시 표시, 아니면 '새 탭에서 열기' fallback 사용). */
function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const v = u.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}`
      const shorts = u.pathname.match(/^\/shorts\/([^/]+)/)
      if (shorts) return `https://www.youtube.com/embed/${shorts[1]}`
    }
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1)
      if (id) return `https://www.youtube.com/embed/${id}`
    }
    if (host === 'vimeo.com') {
      const id = u.pathname.split('/').filter(Boolean)[0]
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`
    }
    return url
  } catch {
    return url
  }
}

/**
 * §6/§7 플레이 화면 — 갤러리 카드 클릭 시 화면 전체(풀스크린)로 게임을 재생한다.
 * 헤더/푸터 없이 게임만 표시하고, 우상단 플로팅 닫기(✕)·우하단 전체화면 버튼만 오버레이한다.
 * 마운트=세션 시작, 언마운트=세션 종료 → uses/completions/체류시간 통계 수집.
 * 닫기(✕·Esc) 시 게임 위에 리뷰 팝업(GameReviewModal)을 띄운다.
 */
export function PlayModal({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  const { session, sendEvent } = usePlaySession(item.id, true)

  const stageRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  // 게임 종료 시 게임 위에 리뷰 팝업을 먼저 띄운다(무조건). 닫기=리뷰 표시.
  const [reviewing, setReviewing] = useState(false)

  // Esc로 리뷰 열기 + 배경 스크롤 잠금
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !document.fullscreenElement) setReviewing(true)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [])

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === stageRef.current)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  // §7 샌드박스 게임 이벤트 릴레이 — source 동일성 검사 → isGameEvent 형식 검사 → sendEvent
  useEffect(() => {
    if (item.kind !== 'html' && item.kind !== 'zip') return
    function onMessage(e: MessageEvent) {
      if (e.source !== iframeRef.current?.contentWindow) return
      if (!isGameEvent(e.data)) return
      sendEvent(e.data.eventId, e.data.event, e.data.payload)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [session?.id])

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      stageRef.current?.requestFullscreen()
    }
  }

  return (
    <div
      ref={stageRef}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      {/* url — 외부 링크 임베드(YouTube/Vimeo는 embed URL로 변환).
          X-Frame-Options로 임베드가 막히는 사이트는 아래 '새 탭에서 열기'로 대체 */}
      {item.kind === 'url' && item.externalUrl && (
        <>
          <iframe
            src={toEmbedUrl(item.externalUrl)}
            title={item.title}
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            className="h-full w-full border-0"
          />
          <a
            href={item.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 left-4 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/80"
          >
            안 보이면 새 탭에서 열기 ↗
          </a>
        </>
      )}

      {item.kind === 'url' && !item.externalUrl && (
        <p className="px-8 text-center text-sm text-white/80">
          이 외부 콘텐츠에는 열 수 있는 링크가 없습니다.
        </p>
      )}

      {/* zip(SPA)·html — 격리 서브도메인 오리진에서 서빙되므로 allow-same-origin 안전(마이크 포함) */}
      {(item.kind === 'zip' || item.kind === 'html') && (
        <iframe
          ref={iframeRef}
          src={item.entryUrl!}
          sandbox="allow-scripts allow-same-origin allow-modals"
          allow="microphone; autoplay"
          title={item.title}
          className="h-full w-full border-0"
        />
      )}

      {item.kind === 'video' && (
        <video
          src={item.entryUrl!}
          controls
          className="max-h-full max-w-full"
          onEnded={() => session && sendEvent(`media-ended-${session.id}`, 'complete')}
        />
      )}

      {item.kind === 'audio' && (
        <audio
          src={item.entryUrl!}
          controls
          className="w-full max-w-lg px-4"
          onEnded={() => session && sendEvent(`media-ended-${session.id}`, 'complete')}
        />
      )}

      {/* 플로팅 닫기(✕) — 헤더 바 대신 게임 위 우상단 */}
      <button
        onClick={() => setReviewing(true)}
        aria-label="닫기"
        className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-black/45 text-xl leading-none text-white backdrop-blur transition hover:bg-black/65"
      >
        ✕
      </button>

      {/* 플로팅 전체화면 토글 */}
      <button
        onClick={toggleFullscreen}
        className="absolute bottom-4 right-4 z-10 rounded-lg bg-black/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/65"
      >
        {isFullscreen ? '전체화면 종료' : '전체화면'}
      </button>

      {/* 게임 종료 시 게임 위에서 뜨는 리뷰 팝업 */}
      {reviewing && (
        <GameReviewModal item={item} onCancel={() => setReviewing(false)} onDone={onClose} />
      )}
    </div>
  )
}
