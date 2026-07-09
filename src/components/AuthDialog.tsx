import { useState, type ReactElement } from 'react'
import characterFind from '../assets/character7.png'
import characterSignup from '../assets/character4.png'

/** 로그인 화면의 보조 흐름(회원가입·아이디찾기·비밀번호찾기) 모달.
 * 디자인 모드에선 백엔드 없이 입력 검증 후 목업 결과 메시지를 보여준다. 파란색은 리스트와 동일(#0ea5e9). */
export type AuthMode = 'signup' | 'findId' | 'findPw'

type FieldKey = 'name' | 'id' | 'password' | 'passwordConfirm' | 'email'

const ICON_USER = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
    <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="2" />
    <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const ICON_LOCK = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
    <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5" stroke="currentColor" strokeWidth="2" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const ICON_MAIL = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="2" />
    <path d="M4.5 7.5l7.5 5.5 7.5-5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

type FieldDef = { key: FieldKey; label: string; placeholder: string; type: string; icon: ReactElement }

const FIELD: Record<FieldKey, FieldDef> = {
  name: { key: 'name', label: '이름', placeholder: '이름', type: 'text', icon: ICON_USER },
  id: { key: 'id', label: '아이디', placeholder: 'ID', type: 'text', icon: ICON_USER },
  password: { key: 'password', label: '비밀번호', placeholder: 'Password', type: 'password', icon: ICON_LOCK },
  passwordConfirm: {
    key: 'passwordConfirm',
    label: '비밀번호 확인',
    placeholder: 'Password 확인',
    type: 'password',
    icon: ICON_LOCK,
  },
  email: { key: 'email', label: '이메일', placeholder: 'example@email.com', type: 'email', icon: ICON_MAIL },
}

const FORMS: Record<AuthMode, { title: string; subtitle: string; submit: string; fields: FieldKey[] }> = {
  signup: {
    title: '회원가입',
    subtitle: '폴리 파닉스에 오신 걸 환영해요!',
    submit: '가입하기',
    fields: ['name', 'id', 'password', 'passwordConfirm', 'email'],
  },
  findId: {
    title: '아이디 찾기',
    subtitle: '가입한 이름과 이메일을 입력해 주세요.',
    submit: '아이디 찾기',
    fields: ['name', 'email'],
  },
  findPw: {
    title: '비밀번호 찾기',
    subtitle: '가입한 아이디와 이메일을 입력해 주세요.',
    submit: '재설정 링크 받기',
    fields: ['id', 'email'],
  },
}

export function AuthDialog({ mode, onClose }: { mode: AuthMode; onClose: () => void }) {
  const form = FORMS[mode]
  const [values, setValues] = useState<Partial<Record<FieldKey, string>>>({})
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({})
  const [result, setResult] = useState<string | null>(null)

  const setValue = (key: FieldKey, v: string) => {
    setValues((p) => ({ ...p, [key]: v }))
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: Partial<Record<FieldKey, string>> = {}
    for (const key of form.fields) {
      if (!values[key]?.trim()) next[key] = '필수 입력 항목이에요.'
    }
    if (
      mode === 'signup' &&
      values.password &&
      values.passwordConfirm &&
      values.password !== values.passwordConfirm
    ) {
      next.passwordConfirm = '비밀번호가 일치하지 않아요.'
    }
    if (values.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email.trim())) {
      next.email = '이메일 형식이 올바르지 않아요.'
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return

    // 디자인 모드 — 백엔드 없이 목업 결과 안내
    if (mode === 'signup') setResult('회원가입이 완료되었어요! 로그인해 주세요.')
    else if (mode === 'findId') setResult('회원님의 아이디는 “poly_kid” 입니다.')
    else setResult('비밀번호 재설정 링크를 이메일로 보냈어요.')
  }

  const fieldCls = (hasErr: boolean) =>
    `h-12 w-full rounded-full border pl-12 pr-4 text-[17px] text-[#102a43] placeholder:text-[#8fbfe0] focus:outline-none ${
      hasErr
        ? 'border-[#ff9d9d] bg-[#fff4f4] focus:border-[#ff6b6b] focus:bg-white'
        : 'border-[#c3e0f5] bg-[#eaf4fd] focus:border-[#0ea5e9] focus:bg-white'
    }`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#102a43]/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={form.title}
      onClick={onClose}
    >
      <div
        className="relative max-h-full w-[440px] max-w-full overflow-y-auto rounded-[20px] bg-white px-8 pb-8 pt-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 */}
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-[#8fbfe0] transition hover:bg-[#eaf4fd] hover:text-[#0ea5e9]"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>

        {/* 타이틀 위 캐릭터 — 회원가입: character4, 아이디/비밀번호 찾기: character7 */}
        <img
          src={mode === 'signup' ? characterSignup : characterFind}
          alt=""
          aria-hidden="true"
          className="mx-auto mb-2 h-[104px] w-[104px] object-contain"
        />

        <h2 className="text-center text-[24px] font-extrabold text-[#102a43]">{form.title}</h2>
        <p className="mt-1.5 text-center text-[15px] font-medium text-[#0ea5e9]">{form.subtitle}</p>

        {result ? (
          // 완료/결과 화면
          <div className="mt-7 flex flex-col items-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[#e0f2fe] text-[#0ea5e9]">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-8 w-8">
                <path
                  d="M5 12.5l4.5 4.5L19 7"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <p className="mt-4 text-center text-[18px] font-bold text-[#102a43]">{result}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-7 h-[54px] w-full rounded-full bg-gradient-to-b from-[#3cc0f7] to-[#0ea5e9] text-[20px] font-bold text-white shadow-[0_6px_0_#0c82bd,0_10px_16px_rgba(7,89,133,0.3)] transition active:translate-y-[3px] active:shadow-[0_3px_0_#0c82bd,0_6px_10px_rgba(7,89,133,0.25)]"
            >
              확인
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-3.5">
            {form.fields.map((key) => {
              const f = FIELD[key]
              const err = errors[key]
              return (
                <div key={key}>
                  <div className="relative">
                    <span
                      className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${
                        err ? 'text-[#ff6b6b]' : 'text-[#0ea5e9]'
                      }`}
                    >
                      {f.icon}
                    </span>
                    <input
                      type={f.type}
                      value={values[key] ?? ''}
                      onChange={(e) => setValue(key, e.target.value)}
                      placeholder={f.placeholder}
                      aria-label={f.label}
                      aria-invalid={!!err}
                      autoComplete="off"
                      className={fieldCls(!!err)}
                    />
                  </div>
                  {err && (
                    <p className="mt-1.5 flex items-center gap-1.5 pl-3 text-[13px] font-semibold text-[#ff6b6b]">
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-[16px] w-[16px] shrink-0">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                        <path d="M12 7.5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="12" cy="16.2" r="1.1" fill="currentColor" />
                      </svg>
                      {err}
                    </p>
                  )}
                </div>
              )
            })}

            <button
              type="submit"
              className="mt-3 h-[54px] w-full rounded-full bg-gradient-to-b from-[#3cc0f7] to-[#0ea5e9] text-[20px] font-bold text-white shadow-[0_6px_0_#0c82bd,0_10px_16px_rgba(7,89,133,0.3)] transition active:translate-y-[3px] active:shadow-[0_3px_0_#0c82bd,0_6px_10px_rgba(7,89,133,0.25)]"
            >
              {form.submit}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
