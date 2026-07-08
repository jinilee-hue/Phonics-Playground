import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { User } from '../api/types'
import { homeFor } from '../auth/auth'
import { useT } from '../i18n'
import logoUrl from '../assets/logo.png'
import bgVideo from '../assets/login_bg.mp4'
import charactersSprite from '../assets/login-characters-anim.png'

// 캐릭터 스프라이트 시트: 6열 × 6행 = 36프레임(각 622×450), 프레임당 50ms
const SPRITE_COLS = 6
const SPRITE_ROWS = 6
const SPRITE_FRAMES = 36
const SPRITE_FRAME_MS = 50

/** 스프라이트 프레임을 순환 재생해 캐릭터가 움직이게(눈 깜박임 등) 한다. */
function CharacterSprite({ className }: { className?: string }) {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const id = window.setInterval(
      () => setFrame((f) => (f + 1) % SPRITE_FRAMES),
      SPRITE_FRAME_MS,
    )
    return () => window.clearInterval(id)
  }, [])
  const col = frame % SPRITE_COLS
  const row = Math.floor(frame / SPRITE_COLS)
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        backgroundImage: `url(${charactersSprite})`,
        backgroundSize: `${SPRITE_COLS * 100}% ${SPRITE_ROWS * 100}%`,
        backgroundPosition: `${(col / (SPRITE_COLS - 1)) * 100}% ${(row / (SPRITE_ROWS - 1)) * 100}%`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  )
}

const ICON_ID = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
    <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="2" />
    <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const ICON_PW = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
    <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5" stroke="currentColor" strokeWidth="2" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const ICON_EYE = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
    <path
      d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
  </svg>
)

const ICON_EYE_OFF = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
    <path
      d="M4 12s3.5-6.5 8-6.5c1.2 0 2.3.3 3.3.8M20 12s-1 1.9-2.8 3.5M9.5 9.6A3 3 0 0 0 12 15c.5 0 .9-.1 1.3-.3M4 4l16 16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/** 로그인 화면 (Figma login) — 캔디랜드 배경 위 흰 카드, ID/비밀번호 입력. 파란색은 리스트와 동일(#0ea5e9). */
export function LoginPage() {
  const t = useT()
  const [id, setId] = useState(() => localStorage.getItem('savedId') ?? '')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [rememberId, setRememberId] = useState(() => !!localStorage.getItem('savedId'))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const qc = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user = await api.post<User>('/api/auth/login', { email: id, password })
      if (rememberId) localStorage.setItem('savedId', id)
      else localStorage.removeItem('savedId')
      qc.setQueryData(['me'], user)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? homeFor(user.role), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const fieldCls =
    'h-12 w-full rounded-full border border-[#c3e0f5] bg-[#eaf4fd] pl-12 text-[20px] text-[#102a43] placeholder:text-[#8fbfe0] focus:border-[#0ea5e9] focus:outline-none'

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* 배경 (영상) */}
      <video
        src={bgVideo}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* 로그인 카드 */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="relative w-[420px] max-w-full rounded-[20px] bg-white px-[50px] py-[clamp(2.75rem,6vh,5.5rem)] shadow-2xl">
          <img
            src={logoUrl}
            alt="POLY Phonics"
            className="mx-auto h-[clamp(104px,15vh,168px)] w-auto object-contain"
          />

          <form
            onSubmit={onSubmit}
            className="mt-[clamp(2rem,4.5vh,3.75rem)] flex flex-col gap-[clamp(0.75rem,2vh,1.75rem)]"
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#0ea5e9]">
                {ICON_ID}
              </span>
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="ID"
                aria-label="ID"
                autoComplete="username"
                required
                className={`${fieldCls} pr-4`}
              />
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#0ea5e9]">
                {ICON_PW}
              </span>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                aria-label="Password"
                autoComplete="current-password"
                required
                className={`${fieldCls} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 표시'}
                className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center text-[#8fbfe0] transition hover:text-[#0ea5e9]"
              >
                {showPw ? ICON_EYE_OFF : ICON_EYE}
              </button>
            </div>

            <label className="mt-1 flex w-fit cursor-pointer items-center gap-2 text-[16px] text-[#102a43]">
              <input
                type="checkbox"
                checked={rememberId}
                onChange={(e) => setRememberId(e.target.checked)}
                className="peer sr-only"
              />
              <span className="grid h-6 w-6 place-items-center rounded-md border-2 border-[#c3e0f5] bg-white text-white peer-checked:border-[#0ea5e9] peer-checked:bg-[#0ea5e9]">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path
                    d="M5 12.5l4.5 4.5L19 7"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              아이디 저장
            </label>

            {error && <p className="text-center text-sm font-semibold text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="mt-[clamp(0.75rem,2.2vh,2rem)] h-[60px] w-full rounded-full bg-gradient-to-b from-[#3cc0f7] to-[#0ea5e9] text-[28px] font-bold tracking-wide text-white shadow-[0_6px_0_#0c82bd,0_11px_16px_rgba(7,89,133,0.3)] transition active:translate-y-[3px] active:shadow-[0_3px_0_#0c82bd,0_6px_10px_rgba(7,89,133,0.25)] disabled:opacity-60"
            >
              {busy ? '로그인 중…' : 'LOGIN'}
            </button>
          </form>

          {/* 회원가입 · 아이디찾기 · 비밀번호찾기 */}
          <div className="mt-[clamp(1.25rem,3vh,2.5rem)] flex items-center justify-center gap-3 text-[14px] text-[#102a43]">
            <button type="button" className="hover:underline">
              회원가입
            </button>
            <span className="h-3.5 w-px bg-gray-300" />
            <button type="button" className="hover:underline">
              아이디찾기
            </button>
            <span className="h-3.5 w-px bg-gray-300" />
            <button type="button" className="hover:underline">
              비밀번호찾기
            </button>
          </div>

          {/* 이용약관 · 개인정보취급방침 */}
          <div className="mt-[clamp(1rem,2.2vh,2rem)] flex gap-2.5">
            <button
              type="button"
              className="h-12 flex-1 rounded-[10px] bg-[#eaf4fd] text-[14px] font-semibold text-[#0ea5e9] transition hover:bg-[#dcecfb]"
            >
              이용약관
            </button>
            <button
              type="button"
              className="h-12 flex-1 rounded-[10px] bg-[#eaf4fd] text-[14px] font-semibold text-[#0ea5e9] transition hover:bg-[#dcecfb]"
            >
              개인정보취급방침
            </button>
          </div>
        </div>
      </div>

      {/* 캐릭터(스프라이트 애니메이션) — 화면 우하단, 카드 위(z-20). right-0 기준으로 안 잘림 */}
      {/* 캐릭터 위치를 right(2vw)와 max-w로 제어(왼쪽 끝 = 100vw-2vw-width).
          태블릿(lg): max-w 48vw-160px → 왼쪽 끝 50vw+160px(버튼 경계, 안 가림).
          PC(xl+): max-w 48vw-140px → 왼쪽 끝 50vw+140px(20px 더 왼쪽, 박스와 겹침). */}
      <CharacterSprite className="pointer-events-none absolute bottom-[2vw] right-[2vw] z-20 hidden aspect-[622/450] w-[clamp(300px,40vw,820px)] max-w-[calc(48vw-160px)] drop-shadow-[0_18px_14px_rgba(0,0,0,0.38)] lg:block xl:max-w-[calc(48vw-140px)]" />

      {/* AI 안내 + 카피라이트 (하단, 배경 위 흰색) */}
      <div className="absolute inset-x-0 bottom-4 z-10 px-4 text-center text-white/85 [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]">
        <p className="text-[13px] font-medium">{t('footer.aiNotice')}</p>
        <p className="mt-0.5 text-[12px] font-medium tracking-wide">{t('footer.copyright')}</p>
      </div>
    </main>
  )
}
