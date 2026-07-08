import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { GalleryOut, Role, User } from '../api/types'
import { useLogout } from '../auth/auth'
import { LevelSelect } from './LevelSelect'
import { SettingsModal } from './SettingsModal'
import logoUrl from '../assets/logo.png'

const TABS: Record<Role, { to: string; label: string }[]> = {
  student: [{ to: '/gallery', label: '갤러리' }],
  admin: [
    { to: '/gallery', label: '갤러리' },
    { to: '/stats', label: '통계' },
  ],
}

const ROLE_LABEL: Record<Role, string> = { student: '학생', admin: '관리자' }

export function TopBar({ user }: { user: User }) {
  const navigate = useNavigate()
  const logout = useLogout()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  // 레벨 셀렉트는 갤러리 화면에서만 노출. 갤러리 캐시(['gallery'])를 공유해
  // 레벨 목록을 산출하고(재요청 없음), 선택값은 URL 쿼리(?level)로 GalleryPage와 공유한다.
  const onGallery = location.pathname === '/gallery'
  const { data } = useQuery<GalleryOut>({
    queryKey: ['gallery'],
    queryFn: () => api.get<GalleryOut>('/api/gallery'),
    enabled: onGallery,
  })
  const levels = useMemo(
    () =>
      [...new Set((data?.items ?? []).map((i) => i.courseCode).filter((c): c is string => !!c))].sort(),
    [data],
  )
  const selectedLevel = searchParams.get('level') ?? ''

  const setLevel = (value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        value ? next.set('level', value) : next.delete('level')
        return next
      },
      { replace: true },
    )
  }

  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
      <header className="app-topbar">
      <div className="app-topbar-inner">
        <span className="app-brand">
          <img src={logoUrl} alt="POLY Phonics" className="app-brand-logo" />
        </span>
        <nav className="app-nav" aria-label="주 메뉴">
          {TABS[user.role].map((t) => (
            <NavLink key={t.to} to={t.to} className="app-nav-link">
              {t.label}
            </NavLink>
          ))}
        </nav>
        <div className="app-user-menu">
          {onGallery && levels.length > 0 && (
            <LevelSelect
              ariaLabel="레벨 필터"
              value={selectedLevel}
              onChange={setLevel}
              options={[
                { value: '', label: '전체 레벨' },
                ...levels.map((level) => ({ value: level, label: level })),
              ]}
            />
          )}
          <span className="app-user-badge">
            <span className="app-user-avatar" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" focusable="false">
                <circle cx="12" cy="8" r="3.4" fill="currentColor" />
                <path
                  d="M5 19.2c0-3.2 3.1-5.2 7-5.2s7 2 7 5.2"
                  fill="currentColor"
                />
              </svg>
            </span>
            {user.name} <b>{ROLE_LABEL[user.role]}</b>
          </span>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="app-settings"
            aria-label="설정"
            title="설정"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => logout().then(() => navigate('/login'))}
            className="app-logout"
            aria-label="로그아웃"
            title="로그아웃"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <path
                d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 8l4 4-4 4M20 12H10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
      </header>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </>
  )
}
