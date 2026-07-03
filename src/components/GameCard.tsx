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

const KIND_GRADIENT: Record<Kind, string> = {
  html: 'from-sky-400 to-sky-600',
  zip: 'from-violet-400 to-violet-600',
  video: 'from-amber-400 to-amber-600',
  audio: 'from-emerald-400 to-emerald-600',
  url: 'from-pink-400 to-pink-600',
}

const KIND_ICON: Record<Kind, string> = {
  html: 'HTML',
  zip: 'ZIP',
  video: 'VID',
  audio: 'AUD',
  url: 'URL',
}

export function KindBadge({ kind }: { kind: Kind }) {
  return <span className="kind-badge">{KIND_LABEL[kind]}</span>
}

function Thumbnail({ item }: { item: GalleryItem }) {
  const [errored, setErrored] = useState(false)

  if (item.thumbUrl && !errored) {
    return (
      <img
        src={item.thumbUrl}
        alt=""
        loading="lazy"
        onError={() => setErrored(true)}
        className="game-card-thumb"
      />
    )
  }

  return (
    <div className={`game-card-placeholder bg-gradient-to-br ${KIND_GRADIENT[item.kind]}`}>
      <span>{KIND_ICON[item.kind]}</span>
      <b>{KIND_LABEL[item.kind]}</b>
    </div>
  )
}

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
    <button type="button" onClick={() => onPlay(item)} className="game-card">
      <Thumbnail item={item} />
      <div className="game-card-body">
        <div className="game-card-meta">
          <KindBadge kind={item.kind} />
          {published && <span>{published}</span>}
        </div>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
      </div>
      <div className="game-card-footer">
        <span>▶ {item.uses}회 플레이</span>
        <span>✓ 완료 {item.completions}</span>
        {item.ratingCount > 0 && item.ratingAvg != null && (
          <StarAvg avg={item.ratingAvg} count={item.ratingCount} />
        )}
      </div>
    </button>
  )
}
