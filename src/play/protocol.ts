/**
 * §7 샌드박스 게임 이벤트 프로토콜 — sandbox="allow-scripts" iframe은 opaque origin("null")을
 * 가지므로 postMessage의 event.origin은 무의미하다. 부모(PlayPage)는 이벤트를 신뢰하기 전에
 * 두 단계로 검증한다:
 *   1차) event.source === iframeRef.current.contentWindow — 우리가 만든 그 iframe이 보냈는지
 *        동일성(identity) 검사. origin이 아니라 창 객체 참조로 발신자를 특정한다.
 *   2차) isGameEvent(event.data) — 매직 마커 + 필드 형식 검사.
 * 두 검사를 모두 통과한 메시지만 /api/play/sessions/{id}/events로 릴레이한다.
 */

/** 게임 → 부모 postMessage의 매직 마커. studio CSP(connect-src 'none')로 fetch가 막혀 있어
 *  postMessage가 게임이 부모와 통신할 수 있는 유일한 채널이다. */
export const GAME_EVENT_TYPE = '__phonics_game_event'

export interface GameEventMessage {
  type: typeof GAME_EVENT_TYPE
  /** 멱등키 — 재전송해도 서버가 같은 이벤트로 처리하도록 게임이 고정값(예: crypto.randomUUID())을 사용 */
  eventId: string
  /** 이벤트 종류: complete | progress | score | ... */
  event: string
  payload?: unknown
}

/** window.postMessage로 들어온 임의의 데이터가 유효한 게임 이벤트인지 검증 */
export function isGameEvent(data: unknown): data is GameEventMessage {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  if (d.type !== GAME_EVENT_TYPE) return false
  if (typeof d.eventId !== 'string' || d.eventId.length < 1 || d.eventId.length > 100) return false
  if (typeof d.event !== 'string' || d.event.length < 1 || d.event.length > 50) return false
  return true
}
