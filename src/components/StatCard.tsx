import type { ReactNode } from 'react'

/** §16 대시보드 KPI 타일 — 큰 숫자 + 라벨(+선택적 힌트·아이콘). accent로 강조색 지정. */
export function StatCard({
  label,
  value,
  accent,
  hint,
  icon,
}: {
  label: string
  value: string | number
  accent?: string
  hint?: string
  icon?: ReactNode
}) {
  return (
    <div className="group relative flex flex-col items-center rounded-2xl bg-white p-3 text-center shadow-card">
      {/* 힌트: ⓘ는 카드 우측 상단, 말풍선은 카드 어디든 hover 시 표시(group-hover) */}
      {hint && (
        <>
          <span
            aria-label={hint}
            className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-[#e0f2fe] text-[10px] font-bold leading-none text-[#0ea5e9]"
          >
            i
          </span>
          <span className="pointer-events-none absolute right-1.5 top-8 z-10 whitespace-nowrap rounded-lg bg-[#102a43] px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
            {hint}
            <span className="absolute bottom-full right-2.5 h-0 w-0 border-4 border-transparent border-b-[#102a43]" />
          </span>
        </>
      )}
      {icon && (
        <>
          <span className="text-[#0ea5e9]">{icon}</span>
          {/* 아이콘과 타이틀 구분용 2px 파란 가로 라인 */}
          <span className="my-1.5 h-0.5 w-8 rounded-full bg-[#0ea5e9]" />
        </>
      )}
      <div className="text-xs font-medium leading-tight text-gray-400">{label}</div>
      <div className={`mt-0.5 text-2xl font-bold leading-tight ${accent ?? 'text-gray-900'}`}>
        {value}
      </div>
    </div>
  )
}
