import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { GalleryItem, GalleryOut, PlaySession, RatingOut } from '../api/types'
import { KindBadge } from '../components/GameCard'
import { StarRating } from '../components/StarRating'
import { isGameEvent } from '../play/protocol'
import { usePlaySession } from '../play/usePlaySession'

/**
 * §6/§7 플레이 페이지 — id 없으면 간이 피커, id 있으면 kind별 스테이지를 렌더링한다.
 * 갤러리와 동일한 ['gallery'] 쿼리를 재사용해 목록을 다시 받아오지 않는다.
 */
export function PlayPage() {
  const { id } = useParams()
  const contentId = id ? Number(id) : null

  const { data: gallery, isLoading, error, refetch } = useQuery<GalleryOut>({
    queryKey: ['gallery'],
    queryFn: () => api.get<GalleryOut>('/api/gallery'),
  })

  if (contentId == null) {
    return <PlayPicker gallery={gallery} isLoading={isLoading} />
  }

  if (isLoading) {
    return <CenterNotice>불러오는 중…</CenterNotice>
  }

  if (error instanceof Error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <BackLink />
        <div className="mt-6 flex items-center justify-between rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          <span>{error.message}</span>
          <button
            onClick={() => refetch()}
            className="ml-3 shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      </main>
    )
  }

  const item = gallery?.items.find((i) => i.id === contentId)

  if (!item) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <BackLink />
        <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          이 콘텐츠는 더 이상 게시되지 않습니다.
        </p>
      </main>
    )
  }

  return <PlayStage item={item} />
}

function CenterNotice({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[50vh] items-center justify-center text-brand-600">{children}</div>
}

function BackLink() {
  return (
    <Link to="/gallery" className="text-sm text-brand-600 hover:underline">
      ← 갤러리로 돌아가기
    </Link>
  )
}

/** id 없이 /play로 진입했을 때 보여주는 간이 게임 선택 목록 */
function PlayPicker({ gallery, isLoading }: { gallery: GalleryOut | undefined; isLoading: boolean }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-xl font-bold text-gray-900">플레이할 게임 선택</h1>
      <p className="mb-5 text-sm text-gray-500">아래 목록에서 플레이할 게임을 골라주세요.</p>

      {isLoading && <p className="py-10 text-center text-gray-400">불러오는 중…</p>}

      {gallery && gallery.items.length === 0 && (
        <p className="py-10 text-center text-gray-400">아직 게시된 콘텐츠가 없습니다.</p>
      )}

      <ul className="space-y-2">
        {gallery?.items.map((item) => (
          <li key={item.id}>
            <Link
              to={`/play/${item.id}`}
              className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-card hover:ring-1 hover:ring-brand-300"
            >
              <span className="font-semibold text-gray-800">{item.title}</span>
              <KindBadge kind={item.kind} />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}

/** §7 샌드박스 스테이지 — kind별 iframe/video/audio/url 분기 + 전체화면 + 게임 이벤트 릴레이 */
function PlayStage({ item }: { item: GalleryItem }) {
  // url kind는 체류시간 추적 대상이 아니므로 자동 세션/하트비트 루프를 켜지 않는다(아래 url 분기에서 수동 처리).
  const enabled = item.kind !== 'url'
  const { session, sendEvent } = usePlaySession(item.id, enabled)

  const stageRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

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

  /** url kind — iframe 없이 새 탭으로 열되, 세션을 즉시 생성+종료해 uses만 집계(체류시간은 추적 불가) */
  async function openExternal() {
    try {
      const started = await api.post<PlaySession>('/api/play/sessions', { contentId: item.id })
      await api.post(`/api/play/sessions/${started.id}/end`)
    } catch {
      // 기록 실패해도 외부 링크는 그대로 열어준다
    }
    window.open(item.externalUrl!, '_blank', 'noopener,noreferrer')
  }

  const stageCls = isFullscreen ? 'h-full w-full' : 'aspect-video w-full rounded-2xl shadow-card'

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 flex items-center gap-3">
        <BackLink />
        <h1 className="text-lg font-bold text-gray-900">{item.title}</h1>
        <KindBadge kind={item.kind} />
      </div>

      {item.kind === 'url' ? (
        <div className="rounded-2xl bg-white p-6 shadow-card">
          <p className="mb-4 text-sm text-gray-600">{item.description}</p>
          <button
            onClick={openExternal}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            새 탭에서 열기 ↗
          </button>
          <p className="mt-3 text-xs text-gray-400">외부 콘텐츠는 체류시간·완료 추적이 불가합니다.</p>
        </div>
      ) : (
        <div ref={stageRef} className={`relative overflow-hidden bg-black ${stageCls}`}>
          {(item.kind === 'html' || item.kind === 'zip') && (
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
              className="h-full w-full"
              onEnded={() => session && sendEvent(`media-ended-${session.id}`, 'complete')}
            />
          )}

          {item.kind === 'audio' && (
            <audio
              src={item.entryUrl!}
              controls
              className="w-full"
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
      )}

      <RatingBox item={item} />
    </main>
  )
}

/**
 * §6 별점 평가(A) — upsert이므로 재클릭 시 점수 변경.
 * 서버가 돌려준 avg/count/myRating으로 공유 ['gallery'] 캐시의 해당 item만 낙관적 갱신한다.
 * (재요청 없이 갱신 → 갤러리 전체 재집계 왕복 제거 + 재요청 실패 시 PlayStage가 에러로 교체되는 캐스케이드 회피)
 */
function RatingBox({ item }: { item: GalleryItem }) {
  const queryClient = useQueryClient()

  const { mutate: rate, isPending } = useMutation({
    mutationFn: (score: number) =>
      api.post<RatingOut>(`/api/contents/${item.id}/rate`, { score }),
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
    <div className="mt-4 flex items-center gap-4 rounded-2xl bg-white px-4 py-3 shadow-card">
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
