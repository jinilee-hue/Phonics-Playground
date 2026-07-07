import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import type { Role, User } from '../api/types'
import { DESIGN_MODE, DESIGN_USER } from '../designMode'

/** demo2 계정은 모든 권한이 보이도록 admin으로 취급 */
const ALL_ACCESS_EMAILS = ['demo2@test.com']

export function useMe() {
  return useQuery<User | null>({
    queryKey: ['me'],
    queryFn: async () => {
      // 디자인 모드: 백엔드 없이도 동작하도록 네트워크 호출 없이 가상 관리자 반환
      // (백엔드 미기동 시 /api/auth/me 프록시 ECONNREFUSED 방지)
      if (DESIGN_MODE) return DESIGN_USER
      let user: User | null = null
      try {
        user = await api.get<User>('/api/auth/me')
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 401)) throw e
      }
      // demo2 계정 등은 모든 권한 노출을 위해 admin으로 승격
      if (user && ALL_ACCESS_EMAILS.includes(user.email)) user = { ...user, role: 'admin' }
      return user
    },
    staleTime: 60_000,
    retry: false,
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return async () => {
    await api.post('/api/auth/logout')
    qc.setQueryData(['me'], null)
    qc.clear()
  }
}

/** 역할별 홈 라우트 — student·admin 모두 갤러리가 홈 */
export function homeFor(role: Role): string {
  return { student: '/gallery', admin: '/gallery' }[role]
}

function CenterNotice({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center text-brand-600">{children}</div>
}

/** 라우터 가드(§12) — 프런트 이중 방어. 판정은 항상 서버가 한다. */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { data: me, isLoading } = useMe()
  const location = useLocation()

  if (isLoading) return <CenterNotice>불러오는 중…</CenterNotice>
  // 디자인 작업용 — 로그인/권한 체크를 우회하고 모든 페이지를 렌더 (DESIGN_MODE 참고)
  if (DESIGN_MODE) return <>{children}</>
  if (!me) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (!roles.includes(me.role)) return <Navigate to={homeFor(me.role)} replace />
  return <>{children}</>
}
