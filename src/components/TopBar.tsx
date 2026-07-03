import { useNavigate, NavLink } from 'react-router-dom'
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

/** 역할별 탭/메뉴 필터 (§16, studio TopBar 패턴) */
export function TopBar({ user }: { user: User }) {
  const navigate = useNavigate()
  const logout = useLogout()

  return (
    <header className="sticky top-0 z-10 border-b border-brand-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
        <span className="text-lg font-extrabold tracking-tight text-brand-700">
          🎪 PHONICS <span className="text-brand-500">PLAYGROUND</span>
        </span>
        <nav className="flex gap-1">
          {TABS[user.role].map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  isActive ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:text-brand-600'
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-gray-600">
            {user.name} <span className="text-xs text-brand-500">({ROLE_LABEL[user.role]})</span>
          </span>
          <button
            onClick={() => logout().then(() => navigate('/login'))}
            className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:bg-gray-50"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  )
}
