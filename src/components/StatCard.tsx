/** §16 대시보드 KPI 타일 — 큰 숫자 + 라벨(+선택적 힌트). accent로 강조색 지정. */
export function StatCard({
  label,
  value,
  accent,
  hint,
}: {
  label: string
  value: string | number
  accent?: string
  hint?: string
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="text-xs font-medium text-gray-400">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent ?? 'text-gray-900'}`}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-gray-400">{hint}</div>}
    </div>
  )
}
