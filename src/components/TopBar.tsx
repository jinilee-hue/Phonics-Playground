import { NavLink, useNavigate } from 'react-router-dom'
import type { Role, User } from '../api/types'
import { useLogout } from '../auth/auth'

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

  return (
    <header className="app-topbar">
      <div className="app-topbar-inner">
        <span className="app-brand">
          <span className="app-brand-mark">P</span>
          <span>
            PHONICS <b>PLAYGROUND</b>
          </span>
        </span>
        <nav className="app-nav" aria-label="주 메뉴">
          {TABS[user.role].map((t) => (
            <NavLink key={t.to} to={t.to} className="app-nav-link">
              {t.label}
            </NavLink>
          ))}
        </nav>
        <div className="app-user-menu">
          <span>
            {user.name} <b>{ROLE_LABEL[user.role]}</b>
          </span>
          <button onClick={() => logout().then(() => navigate('/login'))} className="app-logout">
            로그아웃
          </button>
        </div>
      </div>
    </header>
  )
}
