import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { Role } from './api/types'
import { homeFor, RequireRole, useMe } from './auth/auth'
import { AppFooter } from './components/AppFooter'
import { BackgroundMusic } from './components/BackgroundMusic'
import { TopBar } from './components/TopBar'
import { GalleryPage } from './pages/GalleryPage'
import { LoginPage } from './pages/LoginPage'
import { useViewMode } from './viewMode'
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
  const viewMode = useViewMode()
  if (!me) return null
  const onGallery = location.pathname === '/gallery'
  // 카드형 갤러리만 뷰포트 높이로 고정(스크롤 없이 한 화면). 리스트형은 세로 스크롤 대시보드.
  const galleryCardView = onGallery && viewMode === 'gallery'
  // 리스트형 대시보드 — 전체 영상 배경 대신 밝은 페이지 위에 흰색 콘텐츠(Figma 참고).
  const galleryListView = onGallery && viewMode === 'list'
  return (
    <div
      className={`app-shell${galleryCardView ? ' app-shell-fixed' : ''}${
        galleryListView ? ' app-shell-dash' : ''
      }`}
    >
      <TopBar user={me} />
      {children}
      {/* 카드형 갤러리는 자체 하단 바를 렌더 → 전역 footer 생략. 그 외(리스트형·통계)는 전역 footer. */}
      {!galleryCardView && <AppFooter />}
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
    <BrowserRouter>
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
