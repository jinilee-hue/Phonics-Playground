import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import type { GalleryItem, GalleryOut, RatingOut } from '../api/types'
import { KindBadge } from './GameCard'
import { StarRating } from './StarRating'
import { isGameEvent } from '../play/protocol'
import { usePlaySession } from '../play/usePlaySession'

/** 외부 URL을 모달 iframe에 임베드 가능한 형태로 변환한다.
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
 * §6/§7 플레이 모달 — 갤러리 카드 클릭 시 화면 ~90%를 덮는 오버레이에서 게임을 재생한다.
 * 기존 PlayPage의 PlayStage + RatingBox 로직을 그대로 이전했다(유일한 재생·세션·별점 경로).
 * 모달 마운트=세션 시작, 언마운트=세션 종료 → uses/completions/체류시간 통계가 계속 수집된다.
 */
export function PlayModal({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  // 모든 kind를 모달 안에서 재생/임베드하므로 세션·하트비트로 use·체류시간을 집계한다.
  const { session, sendEvent } = usePlaySession(item.id, true)

  const stageRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Esc로 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !document.fullscreenElement) onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-[90dvh] w-[90vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
      >
        <header className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
          <KindBadge kind={item.kind} />
          <h2 className="truncate text-lg font-bold text-gray-900">{item.title}</h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="ml-auto rounded-lg px-2.5 py-1 text-xl leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>
        </header>

        <div
          ref={stageRef}
          className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black"
        >
          {/* url — 외부 링크를 모달 안에서 임베드(YouTube/Vimeo는 embed URL로 변환).
              sandbox로 상위 창 탈취를 막고(allow-top-navigation 미부여),
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
              {/* 프레이밍을 막는 사이트(빈 화면) 대비 항상 보이는 대체 링크 */}
              <a
                href={item.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/80"
              >
                안 보이면 새 탭에서 열기 ↗
              </a>
            </>
          )}

          {/* url인데 링크가 없는 경우 — 빈 검정 화면 대신 안내 표시 */}
          {item.kind === 'url' && !item.externalUrl && (
            <p className="px-8 text-center text-sm text-white/80">
              이 외부 콘텐츠에는 열 수 있는 링크가 없습니다.
            </p>
          )}

          {/* zip(SPA)은 격리된 서브도메인 오리진에서 서빙되므로 allow-same-origin이 안전 */}
          {item.kind === 'zip' && (
            <iframe
              ref={iframeRef}
              src={item.entryUrl!}
              sandbox="allow-scripts allow-same-origin allow-modals"
              allow="microphone; autoplay"
              title={item.title}
              className="h-full w-full border-0"
            />
          )}

          {/* html(자체완결)은 opaque origin 유지 */}
          {item.kind === 'html' && (
            <iframe
              ref={iframeRef}
              src={item.entryUrl!}
              sandbox="allow-scripts"
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

          <button
            onClick={toggleFullscreen}
            className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/80"
          >
            {isFullscreen ? '닫기' : '전체화면'}
          </button>
        </div>

        <RatingBox item={item} />
      </div>
    </div>
  )
}

/**
 * §6 별점 평가(A) — upsert이므로 재클릭 시 점수 변경.
 * 서버가 돌려준 avg/count/myRating으로 공유 ['gallery'] 캐시의 해당 item만 낙관적 갱신한다.
 * (재요청 없이 갱신 → 갤러리 전체 재집계 왕복 제거. 모달 뒤 카드에도 즉시 반영된다.)
 */
function RatingBox({ item }: { item: GalleryItem }) {
  const queryClient = useQueryClient()

  const { mutate: rate, isPending } = useMutation({
    mutationFn: (score: number) => api.post<RatingOut>(`/api/contents/${item.id}/rate`, { score }),
    onSuccess: (result) => {
      queryClient.setQueryData<GalleryOut>(['gallery'], (prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((it) =>
                it.id === item.id
                  ? { ...it, ratingAvg: result.avg, ratingCount: result.count, myRating: result.myRating }
                  : it,
              ),
            }
          : prev,
      )
    },
  })

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 px-4 py-3">
      <span className="text-sm font-semibold text-gray-700">이 게임 어땠나요?</span>
      <StarRating value={item.myRating} onRate={rate} disabled={isPending} />
      {item.ratingCount > 0 && item.ratingAvg != null && (
        <span className="ml-auto text-xs text-gray-400">
          평균 ★ {item.ratingAvg.toFixed(1)} ({item.ratingCount}명)
        </span>
      )}
    </div>
  )
}
