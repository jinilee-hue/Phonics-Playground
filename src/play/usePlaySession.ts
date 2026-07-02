import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { api } from '../api/client'
import type { PlaySession } from '../api/types'

const HEARTBEAT_INTERVAL_MS = 15_000

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
      fetch(`/api/play/sessions/${session.id}/end`, {
        method: 'POST',
        keepalive: true,
        credentials: 'include',
      }).catch(() => {})
    }

    const heartbeat = () => {
      api.post(`/api/play/sessions/${session.id}/heartbeat`).catch(() => {})
    }

    const timer = window.setInterval(heartbeat, HEARTBEAT_INTERVAL_MS)
    window.addEventListener('pagehide', endSession)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('pagehide', endSession)
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
