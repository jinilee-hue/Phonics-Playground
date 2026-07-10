import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { GalleryOut, Role, User } from '../api/types'
import { useLogout } from '../auth/auth'
import { LevelSelect } from './LevelSelect'
import { SettingsModal } from './SettingsModal'
import { StatsModal } from './StatsModal'
import { setViewMode, useViewMode } from '../viewMode'
import { useLang, useT } from '../i18n'
import { translateContent } from '../contentI18n'
import logoUrl from '../assets/logo.png'

const TABS: Record<Role, { to: string; labelKey: string }[]> = {
  student: [{ to: '/gallery', labelKey: 'nav.gallery' }],
  admin: [
    { to: '/gallery', labelKey: 'nav.gallery' },
    { to: '/stats', labelKey: 'nav.stats' },
  ],
}

const ROLE_KEY: Record<Role, string> = { student: 'role.student', admin: 'role.admin' }

export function TopBar({ user }: { user: User }) {
  const t = useT()
  const lang = useLang()
  const navigate = useNavigate()
  const logout = useLogout()
  const location = useLocation()
  const viewMode = useViewMode()
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
  // 게임학습종류 = 카드 태그의 skillLabel(예: 알파벳 인지). 코드와 같으면(택소노미 폴백) 제외.
  const skills = useMemo(
    () =>
      [
        ...new Set(
          (data?.items ?? [])
            .filter((i) => i.skillLabel && i.skillLabel !== i.skillCode)
            .map((i) => i.skillLabel as string),
        ),
      ].sort(),
    [data],
  )
  const selectedLevel = searchParams.get('level') ?? ''
  const selectedSkill = searchParams.get('skill') ?? ''

  // URL 쿼리 파라미터 하나를 갱신(빈 값이면 제거) — GalleryPage와 상태 공유.
  const setParam = (key: string, value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        value ? next.set(key, value) : next.delete(key)
        return next
      },
      { replace: true },
    )
  }

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)

  // 리스트형에서 스크롤을 내리면 헤더에 반투명 흰 배경이 깔린다.
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header className={`app-topbar${scrolled ? ' is-scrolled' : ''}`}>
      <div className="app-topbar-inner">
        {/* 리스트형 최상단(미스크롤)에선 헤더 로고를 숨기고 히어로 헤드라인 위 큰 로고로 대체 */}
        <span
          className={`app-brand${
            onGallery && viewMode === 'list' && !scrolled ? ' app-brand-hidden' : ''
          }`}
        >
          <img src={logoUrl} alt="POLY Phonics" className="app-brand-logo" />
        </span>
        {/* 리스트형 갤러리에선 갤러리/통계 토글을 숨기고, 통계는 우측 그래프 아이콘으로 노출 */}
        {!(onGallery && viewMode === 'list') && (
          <nav className="app-nav" aria-label={t('nav.gallery')}>
            {TABS[user.role].map((tab) => (
              <NavLink key={tab.to} to={tab.to} className="app-nav-link">
                {t(tab.labelKey)}
              </NavLink>
            ))}
          </nav>
        )}
        <div className="app-user-menu">
          {/* 리스트형은 레벨 필터를 "영역별" 섹션 탭으로 옮겼으므로 헤더에선 숨김 */}
          {onGallery && viewMode !== 'list' && levels.length > 0 && (
            <LevelSelect
              ariaLabel={t('topbar.levelFilter')}
              value={selectedLevel}
              onChange={(v) => setParam('level', v)}
              options={[
                { value: '', label: t('level.all') },
                ...levels.map((level) => ({ value: level, label: level })),
              ]}
            />
          )}
          {/* 리스트형에선 학습 필터도 숨김(헤더 최소화) */}
          {onGallery && viewMode !== 'list' && skills.length > 0 && (
            <LevelSelect
              ariaLabel={t('topbar.skillFilter')}
              value={selectedSkill}
              onChange={(v) => setParam('skill', v)}
              options={[
                { value: '', label: t('skill.all') },
                ...skills.map((skill) => ({ value: skill, label: translateContent(skill, lang) })),
              ]}
            />
          )}
          <span className="app-user-badge">
            <span className="app-user-avatar" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor" focusable="false">
                <circle cx="12" cy="8.5" r="4.3" />
                <path d="M12 13.6c-4.6 0-8.3 3-8.3 6.8V26h16.6v-5.6c0-3.8-3.7-6.8-8.3-6.8z" />
              </svg>
            </span>
            {user.name} <b>{t(ROLE_KEY[user.role])}</b>
          </span>
          {/* 리스트형에서 통계 진입 — 그래프 아이콘(설정 버튼 앞, 관리자만). 라우트 이동 없이 모달 */}
          {onGallery && viewMode === 'list' && user.role === 'admin' && (
            <button
              type="button"
              onClick={() => setStatsOpen(true)}
              className="app-settings"
              aria-label={t('nav.stats')}
              title={t('nav.stats')}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path
                  d="M6 20v-6M12 20V7M18 20v-9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
          {/* 리스트형/카드형 전환 — 설정 버튼 앞. 현재의 반대 뷰 아이콘(=전환 대상)을 노출 */}
          {onGallery && (
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'list' ? 'gallery' : 'list')}
              className="app-settings"
              aria-label={t(viewMode === 'list' ? 'view.gallery' : 'view.list')}
              title={t(viewMode === 'list' ? 'view.gallery' : 'view.list')}
            >
              {viewMode === 'list' ? (
                // 카드형으로 전환 — 그리드(카드) 아이콘
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                  <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="2" />
                  <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="2" />
                  <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="2" />
                  <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="2" />
                </svg>
              ) : (
                // 리스트형으로 전환 — 라인 3개 아이콘
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="app-settings"
            aria-label={t('topbar.settings')}
            title={t('topbar.settings')}
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
            aria-label={t('topbar.logout')}
            title={t('topbar.logout')}
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
      {statsOpen && <StatsModal onClose={() => setStatsOpen(false)} />}
    </>
  )
}
