# 🎪 PHONICS PLAYGROUND — Frontend

학생용 **Phonics Playground**의 웹 클라이언트입니다. React SPA(Vite)로,
발행된 포닉스 게임을 둘러보고(gallery) 직접 플레이하며(play) 관리자는 통계(stats)를 확인합니다.
게임은 격리된 `iframe` 안에서 실행되고, 게임 이벤트는 postMessage로 부모(SPA)에 전달됩니다.

- **포트**: `:5174`
- **탭**: gallery / play / stats(admin 전용)

---

## 기술 스택

| 구분 | 내용 |
|---|---|
| 프레임워크 | React **19** |
| 빌드 도구 | Vite **6** |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS **v4** (CSS-first, `tailwind.config` 없음 · `@tailwindcss/vite` 플러그인) |
| 라우팅 | React Router 7 |
| 서버 상태 | TanStack Query 5 |

---

## 사전 요구사항

Node.js. 개발 시 **두 개의 backend가 모두 실행 중**이어야 합니다:

| 대상 | 포트 | 용도 |
|---|---|---|
| phonics-playground backend | `:8200` | 본 앱 API (`/api`) |
| phonics-studio backend | `:8100` | 게임 번들 제공 (`/c`) |

---

## 실행 (개발)

```bash
npm install
npm run dev        # http://localhost:5174 (strictPort)
```

### 스크립트

| 스크립트 | 동작 |
|---|---|
| `npm run dev` | Vite 개발 서버 |
| `npm run build` | `tsc -b && vite build` (타입 체크 후 빌드) |
| `npm run preview` | 빌드 결과 미리보기 |

---

## API 라우팅

런타임 base URL이 없습니다. API 클라이언트(`src/api/client.ts`)는 **상대 경로**(`/api/...`)로
`credentials: 'include'` 요청을 보내고, backend로의 라우팅은 Vite dev proxy(`vite.config.ts`)가 처리합니다.

| 경로 | 프록시 대상 | 설명 |
|---|---|---|
| `/api` | `http://localhost:8200` | playground backend |
| `/c` | `http://localhost:8100` | studio 게임 번들 (iframe을 same-origin 하위경로로 유지) |

> **운영 배포 시 주의**: 빌드타임 환경변수 전환이 없으므로, 정적 SPA 앞단의 리버스 프록시에서
> 동일한 라우팅(`/api` → playground backend, `/c` → studio)을 반드시 재현해야 합니다.
> `src/api/client.ts`는 FastAPI의 `detail`(문자열/배열)을 파싱하는 `ApiError` 클래스도 제공합니다.

---

## 게임 이벤트 프로토콜 (요약)

게임은 격리된 `iframe sandbox="allow-scripts"`(opaque origin)에서 실행되며, 부모로 이벤트를 보냅니다:

```js
window.parent.postMessage({
  type: "__phonics_game_event",   // 매직 마커 (필수)
  eventId: "complete",            // 멱등 키 — 재전송 시 동일 값 (세션 내 UNIQUE)
  event: "complete",              // complete | progress | score | ...
  payload: { score: 60 }          // 자유 형식 (서버가 2KB로 절단)
}, "*")                           // sandbox opaque origin은 부모 origin을 모르므로 "*" 사용
```

- 부모(SPA)는 `event.source === iframe.contentWindow` + 매직 마커를 검증한 뒤
  `POST /api/play/sessions/{id}/events`로 릴레이합니다. `event === "complete"`면 세션을 완료 처리합니다.
- 프로토콜을 구현하지 않은 게임도 세션 수(uses)와 체류 시간(15초 heartbeat)은 자동 수집됩니다
  (단, `completed`는 `false` 유지).
- video/audio 콘텐츠는 `ended` 시 자동 완료, 외부 URL 콘텐츠는 새 탭으로 열리며 uses만 집계됩니다.

---

## 관련 프로젝트

- **phonics-playground/backend** — 본 앱의 API 서버 (`:8200`).
- **phonics-studio** — 콘텐츠 제작·발행 파이프라인. 게임 번들 소스 (`:8100`).
