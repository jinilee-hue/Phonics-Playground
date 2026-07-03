import { Link } from 'react-router-dom'
import type { GalleryItem, Kind } from '../api/types'
import { StarAvg } from './StarRating'

const KIND_LABEL: Record<Kind, string> = {
  html: 'HTML',
  zip: 'ZIP',
  video: '비디오',
  audio: '오디오',
  url: 'URL',
}

/** §6 갤러리 카드 배지 — studio KindBadge 패턴을 로컬로 축소 구현 (PlayPage 헤더에서도 재사용) */
export function KindBadge({ kind }: { kind: Kind }) {
  return (
    <span className="rounded-md bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
      {KIND_LABEL[kind]}
    </span>
  )
}

/** §6 갤러리 카드 — 카드 전체가 /play/{id}로 이동하는 링크 */
export function GameCard({ item }: { item: GalleryItem }) {
  const published = item.publishedAt
    ? new Date(item.publishedAt).toLocaleString('ko-KR', { dateStyle: 'short' })
    : null

  return (
    <Link
      to={`/play/${item.id}`}
      className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-transparent transition hover:ring-brand-300"
    >
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <KindBadge kind={item.kind} />
          {published && <span className="text-xs text-gray-400">{published}</span>}
        </div>
        <h3 className="text-base font-bold text-gray-900">{item.title}</h3>
        <p className="line-clamp-2 text-sm text-gray-500">{item.description}</p>
      </div>
      <div className="flex items-center gap-2 border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500">
        <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-600">
          ▶ {item.uses}회 플레이
        </span>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-600">
          ✓ 완료 {item.completions}
        </span>
        {item.ratingCount > 0 && item.ratingAvg != null && (
          <StarAvg avg={item.ratingAvg} count={item.ratingCount} />
        )}
      </div>
    </Link>
  )
}
