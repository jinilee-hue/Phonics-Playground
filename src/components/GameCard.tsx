import { useState } from 'react'
import type { GalleryItem, Kind } from '../api/types'
import { StarAvg } from './StarRating'

export const KIND_LABEL: Record<Kind, string> = {
  html: 'HTML',
  zip: 'ZIP',
  video: '비디오',
  audio: '오디오',
  url: 'URL',
}

/** 종류별 플레이스홀더 그라데이션 — StatsPage KIND_COLOR와 같은 색 계열 */
const KIND_GRADIENT: Record<Kind, string> = {
  html: 'from-sky-400 to-sky-600',
  zip: 'from-violet-400 to-violet-600',
  video: 'from-amber-400 to-amber-600',
  audio: 'from-emerald-400 to-emerald-600',
  url: 'from-pink-400 to-pink-600',
}

const KIND_ICON: Record<Kind, string> = {
  html: '🎮',
  zip: '🎮',
  video: '🎬',
  audio: '🎧',
  url: '🔗',
}

/** §6 갤러리 카드 배지 — studio KindBadge 패턴을 로컬로 축소 구현 (PlayModal 헤더에서도 재사용) */
export function KindBadge({ kind }: { kind: Kind }) {
  return (
    <span className="rounded-md bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
      {KIND_LABEL[kind]}
    </span>
  )
}

/** 카드 상단 썸네일 — thumbUrl이 있으면 이미지, 없거나 로드 실패면 종류별 색상 플레이스홀더 */
function Thumbnail({ item }: { item: GalleryItem }) {
  const [errored, setErrored] = useState(false)

  if (item.thumbUrl && !errored) {
    return (
      <img
        src={item.thumbUrl}
        alt=""
        loading="lazy"
        onError={() => setErrored(true)}
        className="aspect-video w-full object-cover"
      />
    )
  }

  return (
    <div
      className={`flex aspect-video w-full flex-col items-center justify-center gap-1 bg-gradient-to-br ${KIND_GRADIENT[item.kind]}`}
    >
      <span className="text-3xl">{KIND_ICON[item.kind]}</span>
      <span className="text-xs font-semibold uppercase tracking-wide text-white/90">
        {KIND_LABEL[item.kind]}
      </span>
    </div>
  )
}

/** §6 갤러리 카드 — 카드 전체가 클릭 시 플레이 모달을 연다 */
export function GameCard({
  item,
  onPlay,
}: {
  item: GalleryItem
  onPlay: (item: GalleryItem) => void
}) {
  const published = item.publishedAt
    ? new Date(item.publishedAt).toLocaleString('ko-KR', { dateStyle: 'short' })
    : null

  return (
    <button
      type="button"
      onClick={() => onPlay(item)}
      className="flex w-full flex-col overflow-hidden rounded-2xl bg-white text-left shadow-card ring-1 ring-transparent transition hover:ring-brand-300"
    >
      <Thumbnail item={item} />
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
    </button>
  )
}
