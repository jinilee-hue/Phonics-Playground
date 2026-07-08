import { useRef, useState } from 'react'
import type { GalleryItem, Kind } from '../api/types'

export const KIND_LABEL: Record<Kind, string> = {
  html: 'HTML',
  zip: 'ZIP',
  video: '비디오',
  audio: '오디오',
  url: 'URL',
}

/** 필터 칩·카드용 친화적 형식 라벨 — 문자 그대로의 HTML/ZIP/URL 대신 사용자 친화 명칭. */
export const KIND_FILTER_LABEL: Record<Kind, string> = {
  html: '인터랙티브',
  zip: '게임 패키지',
  video: '비디오',
  audio: '오디오',
  url: '웹 링크',
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

const KIND_THUMB_META: Record<Kind, { title: string; subtitle: string }> = {
  html: { title: 'Interactive', subtitle: 'HTML game' },
  zip: { title: 'Package', subtitle: 'ZIP bundle' },
  video: { title: 'Watch', subtitle: 'Video lesson' },
  audio: { title: 'Listen', subtitle: 'Audio clip' },
  url: { title: 'Link', subtitle: 'Web activity' },
}

export function KindBadge({ kind }: { kind: Kind }) {
  // 배지도 필터 칩과 동일한 친화적 라벨로 통일(HTML/ZIP/URL → 인터랙티브/게임 패키지/웹 링크)
  return <span className="kind-badge">{KIND_FILTER_LABEL[kind]}</span>
}

/**
 * 로드된 썸네일이 거의 균일(빈 흰색 등)인지 판별한다.
 * 백엔드가 썸네일 없는 콘텐츠에 빈 흰색 PNG를 서빙하므로, 이런 이미지는
 * 실제 썸네일이 아니라고 보고 형식별 기본 썸네일로 대체하기 위함.
 * CORS로 오염된 캔버스는 getImageData가 예외를 던지므로 그때는 이미지를 유지한다.
 */
function isBlankImage(img: HTMLImageElement): boolean {
  const size = 24
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  try {
    ctx.drawImage(img, 0, 0, size, size)
    const { data } = ctx.getImageData(0, 0, size, size)
    let min = 255
    let max = 0
    let total = 0
    const pixels = data.length / 4
    for (let i = 0; i < data.length; i += 4) {
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3
      total += lum
      if (lum < min) min = lum
      if (lum > max) max = lum
    }
    // 밝고(평균>242) 편차가 거의 없으면(범위<12) 빈 흰색으로 간주.
    // 투명 배경 로고 등은 색상 픽셀 때문에 편차가 커서 오탐되지 않는다.
    return total / pixels > 242 && max - min < 12
  } catch {
    return false // 캔버스 오염(CORS) 등 → 판별 불가, 원본 이미지 유지
  }
}

function Thumbnail({ item }: { item: GalleryItem }) {
  // 로드 에러 + 빈(균일) 이미지를 모두 fallback으로 처리한다.
  const [showFallback, setShowFallback] = useState(false)
  // 리렌더마다 ref 콜백이 재호출돼도 캔버스 디코드는 이미지당 한 번만 하도록 가드.
  const checkedRef = useRef(false)

  // 이미지 로드 완료 시 한 번만 빈 이미지인지 검사. 캐시된 이미지는 onLoad가 안 뜰 수 있어
  // ref 콜백에서 complete 상태면 즉시 검사한다.
  function checkBlank(img: HTMLImageElement | null) {
    if (!img || checkedRef.current || !img.complete || img.naturalWidth === 0) return
    checkedRef.current = true
    if (isBlankImage(img)) setShowFallback(true)
  }

  if (item.thumbUrl && !showFallback) {
    return (
      <img
        src={item.thumbUrl}
        alt=""
        loading="lazy"
        ref={checkBlank}
        onLoad={(e) => checkBlank(e.currentTarget)}
        onError={() => setShowFallback(true)}
        className="game-card-thumb"
      />
    )
  }

  const meta = KIND_THUMB_META[item.kind]

  return (
    <div
      className={`game-card-placeholder game-card-placeholder-${item.kind} bg-gradient-to-br ${KIND_GRADIENT[item.kind]}`}
    >
      <div className="game-card-placeholder-frame" aria-hidden="true">
        <span>{KIND_ICON[item.kind]}</span>
      </div>
      <div className="game-card-placeholder-copy">
        <strong>{meta.title}</strong>
        <small>{meta.subtitle}</small>
      </div>
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
  // 레벨 · 게임종류(한글 스킬 라벨). 라벨이 영문 코드와 같으면(택소노미 폴백) 생략.
  const showSkillLabel = !!item.skillLabel && item.skillLabel !== item.skillCode
  const hasTags = !!item.courseCode || showSkillLabel
  const hasRating = item.ratingCount > 0 && item.ratingAvg != null

  return (
    <button type="button" onClick={() => onPlay(item)} className="game-card">
      <div className="game-card-media">
        <Thumbnail item={item} />
        {/* 카드 전체가 클릭 버튼이므로 재생 아이콘은 장식용(pointer-events 없음) */}
        <span className="game-card-play" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path
              d="M8 6.2v11.6l10-5.8z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </div>
      <div className="game-card-body">
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <div className="game-card-meta">
          {/* 평점 + 조회수(왼쪽) — ★ 3.2 (1,292), 평점 없으면 조회수만 */}
          <span className="game-card-stat">
            {hasRating && item.ratingAvg != null ? (
              <>
                <span className="game-card-star">★</span> {item.ratingAvg.toFixed(1)}{' '}
                <span className="game-card-views">({item.uses.toLocaleString()})</span>
              </>
            ) : (
              <span className="game-card-views">▶ {item.uses.toLocaleString()}</span>
            )}
          </span>
          {/* 레벨 · 게임종류 태그(오른쪽) */}
          {hasTags && (
            <div className="game-card-tags">
              {item.courseCode && (
                <span className="game-tag game-tag-level">{item.courseCode}</span>
              )}
              {showSkillLabel && (
                <span className="game-tag game-tag-skill-label">{item.skillLabel}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
