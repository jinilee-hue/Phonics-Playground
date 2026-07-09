/**
 * 재사용 페이지네이션 — 이전/다음 + 페이지 번호(많으면 현재 주변 윈도우 + 생략).
 * pageCount<=1이면 렌더하지 않는다. 클라이언트 페이징 표 하단에 사용.
 */

/** 표시할 페이지 번호 목록 계산. 1과 마지막은 항상 포함, 현재 주변 ±1, 사이 간격은 '…'(ellipsis). */
function pageItems(page: number, pageCount: number): (number | 'ellipsis')[] {
  const pages = new Set<number>([1, pageCount, page, page - 1, page + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b)
  const out: (number | 'ellipsis')[] = []
  let prev = 0
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push('ellipsis')
    out.push(p)
    prev = p
  }
  return out
}

export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number
  pageCount: number
  onChange: (page: number) => void
}) {
  if (pageCount <= 1) return null

  // 원형 버튼(번호·화살표 공통)
  const cell =
    'grid h-8 w-8 place-items-center rounded-full text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <nav className="mt-3 flex items-center justify-center gap-1" aria-label="페이지 이동">
      <button
        type="button"
        className={`${cell} border border-gray-300 bg-white text-gray-500 hover:bg-gray-50`}
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="이전"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
          <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {pageItems(page, pageCount).map((item, i) =>
        item === 'ellipsis' ? (
          <span key={`e${i}`} className="px-1 text-gray-400">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-current={item === page ? 'page' : undefined}
            className={`${cell} ${
              item === page ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        className={`${cell} border border-gray-300 bg-white text-gray-500 hover:bg-gray-50`}
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        aria-label="다음"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
          <path d="M10 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </nav>
  )
}
