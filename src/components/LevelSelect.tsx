import { useEffect, useRef, useState } from 'react'

export type SelectOption = { value: string; label: string }

/**
 * poly dashboard kit의 커스텀 셀렉트(.cs-trigger + .cs-dropdown) 구조를 옮긴 컴포넌트.
 * native <select>는 옵션 목록에 CSS(라운드/그림자)를 적용할 수 없어 직접 구현한다.
 */
export function LevelSelect({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value) ?? options[0]

  // 바깥 클릭 · Esc 로 닫기
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="cs-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`cs-trigger${open ? ' open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="cs-value">{selected?.label}</span>
        <svg className="cs-caret" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M6 9.5l6 5.5 6-5.5"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </button>
      {open && (
        <ul className="cs-dropdown" role="listbox" aria-label={ariaLabel}>
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                className={`cs-option${o.value === value ? ' is-selected' : ''}`}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
