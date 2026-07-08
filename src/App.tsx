import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { Role } from './api/types'
import { homeFor, RequireRole, useMe } from './auth/auth'
import { AppFooter } from './components/AppFooter'
import { BackgroundMusic } from './components/BackgroundMusic'
import { TopBar } from './components/TopBar'
import { GalleryPage } from './pages/GalleryPage'
import { LoginPage } from './pages/LoginPage'
import bgVideo from './assets/playground-bg.mp4'

/** /stats는 recharts(무거운 차트 라이브러리)를 포함 → 관리자 진입 시에만 로드(코드 스플릿). */
const StatsPage = lazy(() => import('./pages/StatsPage').then((m) => ({ default: m.StatsPage })))

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
  const location = useLocation()
  if (!me) return null
  // 갤러리는 하단 바(푸터 문구 + 페이지 인디케이터)를 자체적으로 렌더 → 전역 footer 생략.
  const onGallery = location.pathname === '/gallery'
  return (
    // 갤러리는 셸 높이를 뷰포트로 고정 → 낮은 화면에서 카드가 flex로 줄어 스크롤 없이 한 화면.
    <div className={`app-shell${onGallery ? ' app-shell-fixed' : ''}`}>
      <TopBar user={me} />
      {children}
      {!onGallery && <AppFooter />}
    </div>
  )
}

function HomeRedirect() {
  const { data: me, isLoading } = useMe()
  if (isLoading) return null
  return <Navigate to={me ? homeFor(me.role) : '/login'} replace />
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {/* 화면 전체 고정 배경 동영상(콘텐츠 뒤) */}
      <video
        className="app-bg-video"
        src={bgVideo}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <BackgroundMusic />
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
          path="/stats"
          element={
            <Protected roles={['admin']}>
              <Suspense
                fallback={<div className="px-4 py-8 text-center text-gray-400">불러오는 중…</div>}
              >
                <StatsPage />
              </Suspense>
            </Protected>
          }
        />
        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
