import { useRef, useState } from 'react'
import type { GalleryItem, Kind } from '../api/types'
import { useLang } from '../i18n'
import { translateContent } from '../contentI18n'
import starIcon from '../assets/ic_star.png'
import { getGeneratedThumbUrl } from '../gameThumbnails'
import { EventBannerArt } from './EventBannerArt'
import { PhonicsThumbnail } from './PhonicsThumbnail'

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

export function KindBadge({ kind }: { kind: Kind }) {
  // 배지도 필터 칩과 동일한 친화적 라벨로 통일(HTML/ZIP/URL → 인터랙티브/게임 패키지/웹 링크)
  // 종류별로 색을 다르게(kind-badge-{kind})
  return <span className={`kind-badge kind-badge-${kind}`}>{KIND_FILTER_LABEL[kind]}</span>
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

function Thumbnail({ item, className = 'game-card-thumb' }: { item: GalleryItem; className?: string }) {
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

  const generatedThumbUrl = getGeneratedThumbUrl(item.id)
  if (generatedThumbUrl && !showFallback) {
    return (
      <img
        src={generatedThumbUrl}
        alt=""
        loading="lazy"
        onError={() => setShowFallback(true)}
        className={className}
      />
    )
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
        className={className}
      />
    )
  }

  return <PhonicsThumbnail item={item} className={className} />
}

/** 신규 배너 색상 — Figma "이달의 신규 파닉스" 카드(노랑·초록·핑크…) 순환. */
const EVENT_COLORS = ['#fff200', '#c0eb75', '#ffccd2', '#b8e2ff', '#ffd8a8']

/** 리스트형 대시보드 — "이달의 신규 파닉스" 이벤트 배너(밝은 컬러 + 제목·소개 + 원형 화살표). */
export function EventBanner({
  item,
  index = 0,
  onPlay,
}: {
  item: GalleryItem
  index?: number
  onPlay: (item: GalleryItem) => void
}) {
  const lang = useLang()

  return (
    <button
      type="button"
      onClick={() => onPlay(item)}
      className="event-banner"
      style={{ backgroundColor: EVENT_COLORS[index % EVENT_COLORS.length] }}
    >
      <EventBannerArt item={item} bannerColor={EVENT_COLORS[index % EVENT_COLORS.length]} />
      <span className="event-banner-body">
        <h3>{translateContent(item.title, lang)}</h3>
        <p>{translateContent(item.description, lang)}</p>
      </span>
      <span className="event-banner-btn" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path
            d="M5 12h13M13 6l6 6-6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  )
}

/** 리스트형 대시보드 — "영역별 맞춤 파닉스 놀이" 카드(썸네일 위 + 제목 아래 중앙). */
export function PlayCard({
  item,
  onPlay,
}: {
  item: GalleryItem
  onPlay: (item: GalleryItem) => void
}) {
  const lang = useLang()

  return (
    <button type="button" onClick={() => onPlay(item)} className="play-card">
      <span className={`play-card-thumb bg-gradient-to-br ${KIND_GRADIENT[item.kind]}`}>
        <Thumbnail item={item} className="play-card-thumb-img" />
        <span className="play-card-play" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path
              d="M9 7.4v9.2l8-4.6z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="3.6"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </span>
      <span className="play-card-title">{translateContent(item.title, lang)}</span>
    </button>
  )
}

type PillTone = 'gold' | 'silver' | 'bronze' | 'sky' | 'mint'

/** 리스트형 대시보드 — "인기 랭킹 / 최근 플레이" 미니 리스트 행(정사각 썸네일 + 제목·메타 + pill/순위). */
export function RankRow({
  item,
  meta,
  rank,
  rating,
  pill,
  pillTone = 'sky',
  onPlay,
}: {
  item: GalleryItem
  meta: string
  rank?: number
  rating?: number
  pill?: string
  pillTone?: PillTone
  onPlay: (item: GalleryItem) => void
}) {
  const lang = useLang()
  const showSkillLabel = !!item.skillLabel && item.skillLabel !== item.skillCode
  const hasTags = !!item.courseCode || showSkillLabel

  return (
    <button type="button" onClick={() => onPlay(item)} className="rank-row">
      {rank != null && <span className={`rank-no rank-no-${pillTone}`}>{rank}</span>}
      <span className={`rank-thumb bg-gradient-to-br ${KIND_GRADIENT[item.kind]}`}>
        <Thumbnail item={item} className="rank-thumb-img" />
      </span>
      <span className="rank-body">
        <span className="rank-head">
          <h4>{translateContent(item.title, lang)}</h4>
          {pill != null && <span className={`rank-pill rank-pill-${pillTone}`}>{pill}</span>}
        </span>
        <span className="rank-meta">
          <span className="rank-plays">
            {rank != null ? (
              <svg className="rank-play-ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <defs>
                  <linearGradient id="rankPlayGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#5be584" />
                    <stop offset="1" stopColor="#16a34a" />
                  </linearGradient>
                </defs>
                <path
                  d="M9 7.4v9.2l8-4.6z"
                  fill="url(#rankPlayGrad)"
                  stroke="url(#rankPlayGrad)"
                  strokeWidth="4"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg
                className="rank-clock-ic"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M12 7.5V12l3 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {meta}
          </span>
          {rating != null && (
            <span className="rank-rating">
              <img src={starIcon} alt="" className="game-card-star" /> {rating.toFixed(1)}
            </span>
          )}
          {hasTags && (
            <span className="rank-tags">
              {item.courseCode && (
                <span className="game-tag game-tag-level">{item.courseCode}</span>
              )}
              {showSkillLabel && (
                <span className="game-tag game-tag-skill-label">
                  {translateContent(item.skillLabel, lang)}
                </span>
              )}
            </span>
          )}
        </span>
      </span>
      {/* 재생(시작) 버튼 — 행 우측 끝 */}
      <span className="rank-cta" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path
            d="M9 7.4v9.2l8-4.6z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="3.6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </button>
  )
}

export function GameCard({
  item,
  onPlay,
}: {
  item: GalleryItem
  onPlay: (item: GalleryItem) => void
}) {
  const lang = useLang()
  // 레벨 · 게임종류(한글 스킬 라벨). 라벨이 영문 코드와 같으면(택소노미 폴백) 생략.
  const showSkillLabel = !!item.skillLabel && item.skillLabel !== item.skillCode
  const hasTags = !!item.courseCode || showSkillLabel
  const hasRating = item.ratingCount > 0 && item.ratingAvg != null

  return (
    <button type="button" onClick={() => onPlay(item)} className="game-card">
      <div className="game-card-media">
        <Thumbnail item={item} className="game-card-thumb" />
        {/* 카드 전체가 클릭 버튼이므로 재생 아이콘은 장식용(pointer-events 없음) */}
        <span className="game-card-play" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path
              d="M9 7.4v9.2l8-4.6z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="3.6"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </div>
      <div className="game-card-body">
        {/* 평점 + 조회수 — 타이틀 위 */}
        <span className="game-card-stat">
          {hasRating && item.ratingAvg != null ? (
            <>
              <img src={starIcon} alt="" className="game-card-star" /> {item.ratingAvg.toFixed(1)}{' '}
              <span className="game-card-views">({item.uses.toLocaleString()})</span>
            </>
          ) : (
            <span className="game-card-views">▶ {item.uses.toLocaleString()}</span>
          )}
        </span>
        <h3>{translateContent(item.title, lang)}</h3>
        <p>{translateContent(item.description, lang)}</p>
        {/* 레벨 · 게임종류 · AI 태그(하단) */}
        {(hasTags || item.aiGenerated) && (
          <div className="game-card-tags">
            {item.courseCode && <span className="game-tag game-tag-level">{item.courseCode}</span>}
            {showSkillLabel && (
              <span className="game-tag game-tag-skill-label">
                {translateContent(item.skillLabel, lang)}
              </span>
            )}
            {item.aiGenerated && (
              <span className="game-tag game-tag-ai">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M12 2.2l1.9 5.9 5.9 1.9-5.9 1.9L12 17.8l-1.9-5.9L4.2 10l5.9-1.9z"
                    fill="currentColor"
                  />
                  <path d="M19 3l.7 2.1L21.8 6l-2.1.7L19 8.8l-.7-2.1L16.2 6l2.1-.9z" fill="currentColor" />
                </svg>
                AI
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  )
}
