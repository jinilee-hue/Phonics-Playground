import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { api } from '../api/client'
import type { PlaySession } from '../api/types'
import { DESIGN_MODE } from '../designMode'

const HEARTBEAT_INTERVAL_MS = 15_000
/** 체류시간 기반 자동 완료 판정 임계값 — 탭이 보이는 동안 이 시간 이상 플레이하면 complete로 간주 */
const COMPLETION_DWELL_MS = 20_000

/**
 * §6 플레이 세션 수명 관리 훅.
 * - 세션 시작을 useQuery로 감싸 React 19 StrictMode 이중 마운트에서
 *   세션 중복 생성을 쿼리 캐시로 dedupe한다.
 * - 세션이 생성되면 15초마다 하트비트를 보내 체류시간을 서버에 갱신하고,
 *   탭 종료/새로고침(beforeunload 신뢰 불가)에는 'pagehide'에서 keepalive fetch로 종료를 전송한다.
 * - 언마운트/contentId 변경 시 인터벌 정리 + 리스너 해제 + 세션 종료 + 쿼리 캐시 제거.
 */
export function usePlaySession(contentId: number | null, enabled: boolean) {
  const queryClient = useQueryClient()

  const { data: session } = useQuery<PlaySession>({
    queryKey: ['playSession', contentId],
    queryFn: () => api.post<PlaySession>('/api/play/sessions', { contentId }),
    staleTime: Infinity,
    gcTime: 30_000,
    retry: false,
    enabled: enabled && contentId != null,
  })

  useEffect(() => {
    if (!session) return

    const endSession = () => {
      if (DESIGN_MODE) return // 디자인 모드: raw fetch도 프록시로 안 나가게 차단
      fetch(`/api/play/sessions/${session.id}/end`, {
        method: 'POST',
        keepalive: true,
        credentials: 'include',
      }).catch(() => {})
    }

    const heartbeat = () => {
      api.post(`/api/play/sessions/${session.id}/heartbeat`).catch(() => {})
    }

    const heartbeatTimer = window.setInterval(heartbeat, HEARTBEAT_INTERVAL_MS)

    // 게임 코드 의존 없이 프론트가 완료를 자동 판정한다.
    // 세션당 고정 멱등키(complete-{id})를 써서 재전송/중복 전송을 서버가 같은 이벤트로 병합한다.
    // 타이머는 탭이 보이는 동안에만 진행하여 배경 탭 방치가 완료로 집계되는 것을 막는다.
    const completeEventId = `complete-${session.id}`
    let dwellReached = false
    let dwellTimer: number | undefined

    const armDwell = () => {
      if (dwellReached || dwellTimer !== undefined) return
      dwellTimer = window.setTimeout(() => {
        dwellTimer = undefined
        dwellReached = true
        sendEvent(completeEventId, 'complete')
      }, COMPLETION_DWELL_MS)
    }
    const disarmDwell = () => {
      if (dwellTimer === undefined) return
      window.clearTimeout(dwellTimer)
      dwellTimer = undefined
    }
    const onVisibility = () => {
      if (document.hidden) disarmDwell()
      else armDwell()
    }

    if (!document.hidden) armDwell()
    document.addEventListener('visibilitychange', onVisibility)

    // 언로드/언마운트 공통 정리 — 남은 타이머를 취소하고, 완료 조건을 채웠다면
    // keepalive로 complete를 한 번 더 보낸다(전송 실패·언로드 시 유실 방지, 멱등키로 중복 병합).
    const flushOnExit = () => {
      disarmDwell()
      if (!dwellReached) return
      if (DESIGN_MODE) return // 디자인 모드: raw fetch도 프록시로 안 나가게 차단
      fetch(`/api/play/sessions/${session.id}/events`, {
        method: 'POST',
        keepalive: true,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: completeEventId, event: 'complete' }),
      }).catch(() => {})
    }

    const onPageHide = () => {
      flushOnExit()
      endSession()
    }
    window.addEventListener('pagehide', onPageHide)

    return () => {
      window.clearInterval(heartbeatTimer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
      flushOnExit()
      endSession()
      queryClient.removeQueries({ queryKey: ['playSession', contentId] })
    }
  }, [session?.id])

  /** 게임에서 릴레이된(또는 합성된) 이벤트 전송 — 실패는 무시(서버 멱등성이 재시도를 안전하게 함) */
  function sendEvent(eventId: string, event: string, payload?: unknown) {
    if (!session) return
    api.post(`/api/play/sessions/${session.id}/events`, { eventId, event, payload }).catch(() => {})
  }

  return { session, sendEvent }
}
