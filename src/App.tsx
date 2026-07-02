import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { Role } from './api/types'
import { homeFor, RequireRole, useMe } from './auth/auth'
import { TopBar } from './components/TopBar'
import { GalleryPage } from './pages/GalleryPage'
import { LoginPage } from './pages/LoginPage'
import { PlayPage } from './pages/PlayPage'
import { StatsPage } from './pages/StatsPage'

/** 역할 가드 + TopBar 셸 (§12/§16) */
function Protected({ roles, children }: { roles: Role[]; children: ReactNode }) {
  return (
    <RequireRole roles={roles}>
      <Shell>{children}</Shell>
    </RequireRole>
  )
}

function Shell({ children }: { children: ReactNode }) {
  const { data: me } = useMe()
  if (!me) return null
  return (
    <>
      <TopBar user={me} />
      {children}
    </>
  )
}

function HomeRedirect() {
  const { data: me, isLoading } = useMe()
  if (isLoading) return null
  return <Navigate to={me ? homeFor(me.role) : '/login'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/gallery"
          element={
            <Protected roles={['student', 'admin']}>
              <GalleryPage />
            </Protected>
          }
        />
        <Route
          path="/play/:id?"
          element={
            <Protected roles={['student', 'admin']}>
              <PlayPage />
            </Protected>
          }
        />
        <Route
          path="/stats"
          element={
            <Protected roles={['admin']}>
              <StatsPage />
            </Protected>
          }
        />
        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
