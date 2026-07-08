import { useState } from 'react'

/** §6 별점 평가(A) — 인터랙티브 별 5개, hover 시 해당 별까지 미리 채움 */
export function StarRating({
  value,
  onRate,
  disabled = false,
}: {
  value: number | null
  onRate: (score: number) => void
  disabled?: boolean
}) {
  const [hover, setHover] = useState<number | null>(null)
  const filled = hover ?? value ?? 0

  return (
    <div
      role="radiogroup"
      aria-label="별점 평가"
      className="flex items-center gap-0.5"
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          disabled={disabled}
          aria-label={`${n}점 주기`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onRate(n)}
          className={`text-2xl leading-none transition-transform disabled:cursor-not-allowed ${
            n <= filled ? 'text-amber-400' : 'text-gray-300'
          } ${disabled ? '' : 'hover:scale-110'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

/** 읽기 전용 평균 별점 — GameCard 푸터 등 컴팩트 표시용 */
export function StarAvg({ avg }: { avg: number }) {
  return (
    <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-600">
      ★ {avg.toFixed(1)}
    </span>
  )
}
