import { useEffect, useState } from 'react'
import { LevelSelect } from './LevelSelect'
import { getLang, setLang as applyLang, useT, type Lang } from '../i18n'

/**
 * 설정 팝업 — 언어·사운드 등 앱 전역 설정.
 * 언어는 i18n(localStorage 'lang' + 'langchange' 이벤트)에 연결, 사운드는 BackgroundMusic에 연결.
 */
export function SettingsModal({ onClose }: { onClose: () => void }) {
  const t = useT()
  const [lang, setLang] = useState<Lang>(getLang)
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
    const next: Lang = value === 'en' ? 'en' : 'ko'
    setLang(next)
    applyLang(next) // localStorage 저장 + 'langchange' 이벤트 → 전체 UI 즉시 번역
  }

  const toggleSound = () => {
    setSound((prev) => {
      const next = !prev
      localStorage.setItem('sound', next ? 'on' : 'off')
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
        aria-label={t('settings.title')}
      >
        <header className="settings-head">
          <h2>{t('settings.title')}</h2>
          <button
            type="button"
            className="settings-close"
            onClick={onClose}
            aria-label={t('settings.close')}
          >
            ✕
          </button>
        </header>

        <div className="settings-body">
          <div className="settings-row">
            <span className="settings-label">{t('settings.language')}</span>
            <LevelSelect
              ariaLabel={t('settings.language')}
              value={lang}
              onChange={changeLang}
              options={[
                { value: 'ko', label: 'KO' },
                { value: 'en', label: 'EN' },
              ]}
            />
          </div>

          <div className="settings-row">
            <span className="settings-label">{t('settings.sound')}</span>
            <button
              type="button"
              role="switch"
              aria-checked={sound}
              aria-label={t('settings.sound')}
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
