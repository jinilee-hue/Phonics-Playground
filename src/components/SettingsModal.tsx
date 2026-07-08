import { useEffect, useState } from 'react'
import { LevelSelect } from './LevelSelect'

/**
 * 설정 팝업 — 언어·사운드 등 앱 전역 설정.
 * 지금은 선택값을 localStorage에 저장만 한다(실제 번역/사운드 연결은 추후).
 */
export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [lang, setLang] = useState<string>(() => localStorage.getItem('lang') ?? 'ko')
  const [sound, setSound] = useState<boolean>(() => localStorage.getItem('sound') !== 'off')

  // Esc 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const changeLang = (value: string) => {
    setLang(value)
    localStorage.setItem('lang', value)
  }

  const toggleSound = () => {
    setSound((prev) => {
      const next = !prev
      localStorage.setItem('sound', next ? 'on' : 'off')
      // 배경음악에 즉시 반영(BackgroundMusic이 수신)
      window.dispatchEvent(new Event('soundchange'))
      return next
    })
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div
        className="settings-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="설정"
      >
        <header className="settings-head">
          <h2>설정</h2>
          <button type="button" className="settings-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </header>

        <div className="settings-body">
          <div className="settings-row">
            <span className="settings-label">언어</span>
            <LevelSelect
              ariaLabel="언어 선택"
              value={lang}
              onChange={changeLang}
              options={[
                { value: 'ko', label: 'KO' },
                { value: 'en', label: 'EN' },
              ]}
            />
          </div>

          <div className="settings-row">
            <span className="settings-label">사운드</span>
            <button
              type="button"
              role="switch"
              aria-checked={sound}
              aria-label="사운드"
              className={`settings-switch${sound ? ' is-on' : ''}`}
              onClick={toggleSound}
            >
              <span className="settings-switch-knob" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
