import { useState } from 'react'
import type { GalleryItem } from '../api/types'
import { getGeneratedThumbUrl } from '../gameThumbnails'

type ThumbSpec = {
  bg: [string, string]
  accent: string
  label: string
  motif: 'alphabet' | 'fish' | 'song' | 'rhyme' | 'story' | 'magic' | 'quiz' | 'rocket' | 'mole' | 'cards' | 'bingo' | 'maze'
}

const THUMBS: Record<number, ThumbSpec> = {
  1: { bg: ['#14b8ff', '#0479c7'], accent: '#ffd166', label: 'A B C', motif: 'alphabet' },
  2: { bg: ['#9b7cff', '#7227ff'], accent: '#ffd166', label: 'a', motif: 'fish' },
  3: { bg: ['#ffb515', '#ef7d00'], accent: '#fff3b0', label: 'b c d', motif: 'song' },
  4: { bg: ['#13d395', '#079869'], accent: '#c8fff1', label: 'cat hat', motif: 'rhyme' },
  5: { bg: ['#f45ca9', '#e80079'], accent: '#ffe1f0', label: 'story', motif: 'story' },
  6: { bg: ['#16b8f2', '#0678d6'], accent: '#fff3b0', label: 'a e', motif: 'magic' },
  7: { bg: ['#27c6ff', '#0478c8'], accent: '#c7f4ff', label: 'sh ch', motif: 'quiz' },
  8: { bg: ['#9b7cff', '#6633e8'], accent: '#fff3b0', label: 'the', motif: 'cards' },
  9: { bg: ['#22c55e', '#0f8f48'], accent: '#cffafe', label: 'bl st', motif: 'rocket' },
  10: { bg: ['#12c995', '#05865e'], accent: '#d9fff3', label: 'cat hat', motif: 'rhyme' },
  11: { bg: ['#ffad14', '#e46f00'], accent: '#fff3b0', label: 'b c d', motif: 'song' },
  12: { bg: ['#8b7cff', '#5b2ce0'], accent: '#ffd166', label: 'e', motif: 'mole' },
  13: { bg: ['#12b8ff', '#0475c7'], accent: '#fff3b0', label: 'Aa', motif: 'alphabet' },
  14: { bg: ['#14b8ff', '#046ebd'], accent: '#ffd166', label: 'CVC', motif: 'cards' },
  15: { bg: ['#11c98c', '#08865c'], accent: '#ccfff0', label: 'ai ea', motif: 'rhyme' },
  16: { bg: ['#ffad14', '#e46f00'], accent: '#fff3b0', label: 'see', motif: 'cards' },
  17: { bg: ['#f65ca9', '#d90778'], accent: '#ffe1f0', label: 'web', motif: 'story' },
  18: { bg: ['#9475ff', '#5b2ce0'], accent: '#ffd166', label: 'ar er', motif: 'maze' },
  19: { bg: ['#12b8ff', '#076fc9'], accent: '#fff3b0', label: 'i', motif: 'rocket' },
  20: { bg: ['#8d7cff', '#622fe6'], accent: '#ffd166', label: 'o', motif: 'cards' },
  21: { bg: ['#14b8ff', '#0475c7'], accent: '#ffd166', label: 'u', motif: 'mole' },
  22: { bg: ['#11c98c', '#08865c'], accent: '#ccfff0', label: 'wh', motif: 'quiz' },
  23: { bg: ['#ffad14', '#e46f00'], accent: '#fff3b0', label: 'a e i o u', motif: 'song' },
  24: { bg: ['#13b8ff', '#0475c7'], accent: '#ffd166', label: 'fl gl', motif: 'fish' },
  25: { bg: ['#9475ff', '#5b2ce0'], accent: '#fff3b0', label: 'BINGO', motif: 'bingo' },
  26: { bg: ['#12c995', '#05865e'], accent: '#d9fff3', label: 'ou ow', motif: 'maze' },
  27: { bg: ['#f65ca9', '#d90778'], accent: '#ffe1f0', label: 'video', motif: 'story' },
  28: { bg: ['#13b8ff', '#0475c7'], accent: '#ffd166', label: 'or ar', motif: 'maze' },
}

const FALLBACK: ThumbSpec = {
  bg: ['#14b8ff', '#0475c7'],
  accent: '#ffd166',
  label: 'ABC',
  motif: 'alphabet',
}

function Motif({ spec }: { spec: ThumbSpec }) {
  switch (spec.motif) {
    case 'fish':
      return (
        <>
          <path d="M52 50c24-18 57-17 78 0-21 18-54 18-78 0Z" fill="#fff" opacity=".9" />
          <path d="M48 50 30 36v28Z" fill={spec.accent} />
          <circle cx="118" cy="47" r="4" fill="#123047" />
          <path d="M52 88c22 9 61 9 84 0" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" opacity=".36" />
          <text x="78" y="58" textAnchor="middle" className="phonics-thumb-letter" fill="#123047">{spec.label}</text>
        </>
      )
    case 'song':
      return (
        <>
          <circle cx="68" cy="64" r="26" fill="#fff" opacity=".94" />
          <path d="M80 47v37c0 9-8 16-18 16s-18-7-18-16 8-16 18-16c4 0 8 1 11 3V47Z" fill="#123047" opacity=".9" />
          <path d="M92 32h34v17H92Z" fill={spec.accent} />
          <path d="M112 32v43" stroke={spec.accent} strokeWidth="8" strokeLinecap="round" />
          <text x="80" y="133" textAnchor="middle" className="phonics-thumb-small">{spec.label}</text>
        </>
      )
    case 'rhyme':
      return (
        <>
          <path d="M32 51c25-22 72-22 96 0" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" opacity=".52" />
          <path d="M45 72c19-15 50-15 70 0" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" opacity=".7" />
          <path d="M58 94c12-8 32-8 45 0" fill="none" stroke={spec.accent} strokeWidth="9" strokeLinecap="round" />
          <text x="80" y="130" textAnchor="middle" className="phonics-thumb-small">{spec.label}</text>
        </>
      )
    case 'story':
      return (
        <>
          <rect x="32" y="34" width="96" height="70" rx="12" fill="#fff" opacity=".94" />
          <path d="M70 53v32l27-16Z" fill="#123047" />
          <path d="M36 115h88" stroke={spec.accent} strokeWidth="9" strokeLinecap="round" />
          <path d="M48 128h64" stroke="#fff" strokeWidth="7" strokeLinecap="round" opacity=".8" />
          <text x="80" y="151" textAnchor="middle" className="phonics-thumb-tiny">{spec.label}</text>
        </>
      )
    case 'magic':
      return (
        <>
          <path d="M35 112 112 35" stroke="#fff" strokeWidth="12" strokeLinecap="round" />
          <path d="m104 31 9 13 15 2-10 11 3 15-14-7-14 7 3-15-10-11 15-2Z" fill={spec.accent} />
          <text x="53" y="73" textAnchor="middle" className="phonics-thumb-letter">a</text>
          <text x="106" y="124" textAnchor="middle" className="phonics-thumb-letter">e</text>
        </>
      )
    case 'quiz':
      return (
        <>
          <rect x="28" y="38" width="46" height="46" rx="12" fill="#fff" opacity=".92" />
          <rect x="86" y="38" width="46" height="46" rx="12" fill={spec.accent} />
          <path d="M45 112h70" stroke="#fff" strokeWidth="10" strokeLinecap="round" opacity=".72" />
          <text x="51" y="68" textAnchor="middle" className="phonics-thumb-medium">sh</text>
          <text x="109" y="68" textAnchor="middle" className="phonics-thumb-medium" fill="#123047">ch</text>
          <text x="80" y="137" textAnchor="middle" className="phonics-thumb-tiny">?</text>
        </>
      )
    case 'rocket':
      return (
        <>
          <path d="M80 27c24 19 29 55 13 82H67C51 82 56 46 80 27Z" fill="#fff" opacity=".94" />
          <circle cx="80" cy="61" r="11" fill={spec.accent} />
          <path d="M65 108 52 135l28-13 28 13-13-27Z" fill={spec.accent} />
          <text x="80" y="154" textAnchor="middle" className="phonics-thumb-tiny">{spec.label}</text>
        </>
      )
    case 'mole':
      return (
        <>
          <ellipse cx="80" cy="122" rx="54" ry="13" fill="#123047" opacity=".22" />
          <path d="M44 91c5-30 67-30 72 0v31H44Z" fill="#fff" opacity=".94" />
          <circle cx="65" cy="87" r="5" fill="#123047" />
          <circle cx="95" cy="87" r="5" fill="#123047" />
          <path d="M69 104c8 5 14 5 22 0" stroke="#123047" strokeWidth="5" strokeLinecap="round" fill="none" />
          <rect x="56" y="35" width="48" height="34" rx="9" fill={spec.accent} />
          <text x="80" y="60" textAnchor="middle" className="phonics-thumb-medium" fill="#123047">{spec.label}</text>
        </>
      )
    case 'bingo':
      return (
        <>
          <rect x="31" y="31" width="98" height="98" rx="14" fill="#fff" opacity=".94" />
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => (
              <rect key={`${row}-${col}`} x={43 + col * 26} y={43 + row * 26} width="18" height="18" rx="5" fill={(row + col) % 2 ? spec.accent : '#dbeafe'} />
            )),
          )}
          <text x="80" y="151" textAnchor="middle" className="phonics-thumb-tiny">{spec.label}</text>
        </>
      )
    case 'maze':
      return (
        <>
          <path d="M39 38h82v82H39Z" fill="#fff" opacity=".9" />
          <path d="M55 55h50v18H73v16h36v18H55V89h18V73H55Z" fill={spec.accent} />
          <circle cx="55" cy="55" r="7" fill="#123047" />
          <circle cx="109" cy="107" r="7" fill="#123047" />
          <text x="80" y="150" textAnchor="middle" className="phonics-thumb-tiny">{spec.label}</text>
        </>
      )
    case 'cards':
      return (
        <>
          <rect x="33" y="49" width="48" height="64" rx="11" fill="#fff" opacity=".9" transform="rotate(-9 57 81)" />
          <rect x="78" y="45" width="48" height="68" rx="11" fill={spec.accent} transform="rotate(8 102 79)" />
          <text x="56" y="85" textAnchor="middle" className="phonics-thumb-medium">A</text>
          <text x="103" y="86" textAnchor="middle" className="phonics-thumb-medium" fill="#123047">{spec.label.slice(0, 3)}</text>
          <path d="M44 131h72" stroke="#fff" strokeWidth="8" strokeLinecap="round" opacity=".52" />
        </>
      )
    case 'alphabet':
    default:
      return (
        <>
          <rect x="28" y="39" width="45" height="45" rx="12" fill="#fff" opacity=".92" transform="rotate(-7 50 61)" />
          <rect x="84" y="36" width="48" height="48" rx="12" fill={spec.accent} transform="rotate(7 108 60)" />
          <rect x="56" y="92" width="49" height="45" rx="12" fill="#fff" opacity=".86" />
          <text x="50" y="70" textAnchor="middle" className="phonics-thumb-medium">A</text>
          <text x="108" y="69" textAnchor="middle" className="phonics-thumb-medium" fill="#123047">b</text>
          <text x="80" y="124" textAnchor="middle" className="phonics-thumb-medium">C</text>
        </>
      )
  }
}

export function PhonicsThumbnail({
  item,
  className = '',
}: {
  // id·title만 사용 → 갤러리 카드뿐 아니라 통계(ContentStats 등)에서도 최소 객체로 재사용
  item: Pick<GalleryItem, 'id' | 'title'>
  className?: string
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const generatedThumbUrl = getGeneratedThumbUrl(item.id)
  const thumbClass = `phonics-thumb ${className}`.trim()

  if (generatedThumbUrl && !imgFailed) {
    return (
      <img
        src={generatedThumbUrl}
        alt=""
        loading="lazy"
        className={thumbClass}
        onError={() => setImgFailed(true)}
      />
    )
  }

  const spec = THUMBS[item.id] ?? FALLBACK
  const gradientId = `phonics-thumb-${item.id}`

  return (
    <svg
      className={thumbClass}
      viewBox="0 0 160 160"
      role="img"
      aria-label={`${item.title} thumbnail`}
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={spec.bg[0]} />
          <stop offset="1" stopColor={spec.bg[1]} />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="20" fill={`url(#${gradientId})`} />
      <circle cx="132" cy="26" r="42" fill="#fff" opacity=".16" />
      <circle cx="20" cy="142" r="52" fill="#001b2e" opacity=".08" />
      <Motif spec={spec} />
    </svg>
  )
}
