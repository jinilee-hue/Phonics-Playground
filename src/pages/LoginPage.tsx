import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { Role, User } from '../api/types'
import { homeFor } from '../auth/auth'

const inputCls = 'auth-input'

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('student')
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
      const user =
        mode === 'login'
          ? await api.post<User>('/api/auth/login', { email, password })
          : await api.post<User>('/api/auth/signup', { email, password, name, role })
      qc.setQueryData(['me'], user)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? homeFor(user.role), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청을 처리하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-copy-panel" aria-label="Phonics Playground">
        <div className="auth-kicker">Learning Game Playground</div>
        <h1>
          PHONICS <span>PLAYGROUND</span>
        </h1>
        <p>아이들이 게임을 하며 파닉스 지식을 얻는 공간이에요.</p>
        <div className="auth-badges" aria-hidden="true">
          <span>Play</span>
          <span>Learn</span>
          <span>Collect</span>
        </div>
      </section>

      <section className="auth-form-panel" aria-label="로그인">
        <div className="auth-card">
          <div className="auth-card-heading">
            <div className="auth-mark">P</div>
            <div>
              <h2>{mode === 'login' ? '로그인' : '회원가입'}</h2>
              <p>학습 게임을 바로 시작하세요.</p>
            </div>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="인증 방식">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m)
                  setError('')
                }}
                className="auth-tab"
              >
                {m === 'login' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="auth-form">
            {mode === 'signup' && (
              <label className="auth-field">
                <span>이름</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  required
                  className={inputCls}
                />
              </label>
            )}
            <label className="auth-field">
              <span>이메일</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@demo.test"
                required
                className={inputCls}
              />
            </label>
            <label className="auth-field">
              <span>비밀번호</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? '8자 이상 입력' : '비밀번호 입력'}
                required
                minLength={mode === 'signup' ? 8 : undefined}
                className={inputCls}
              />
            </label>
            {mode === 'signup' && (
              <label className="auth-field">
                <span>역할</span>
                <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputCls}>
                  <option value="student">학생 (게임 플레이)</option>
                  <option value="admin">관리자 (통계 확인)</option>
                </select>
              </label>
            )}
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" disabled={busy} className="auth-submit">
              {busy ? '처리 중...' : mode === 'login' ? '로그인' : '가입하기'}
            </button>
          </form>
        </div>

        <div className="demo-account-card">
          <span>데모 계정</span>
          <b>student@demo.test</b>
          <b>admin@demo.test</b>
          <span>비밀번호 공통: demo1234</span>
        </div>
      </section>
    </main>
  )
}
