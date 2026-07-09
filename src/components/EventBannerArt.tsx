import type { GalleryItem } from '../api/types'

type BannerMotif =
  | 'alphabet'
  | 'fish'
  | 'song'
  | 'rhyme'
  | 'story'
  | 'magic'
  | 'quiz'
  | 'rocket'
  | 'mole'
  | 'cards'
  | 'bingo'
  | 'maze'

type BannerSpec = {
  motif: BannerMotif
  label: string
  /** 낚시·송 등 — 배너 톤 대신 전용 accent 색 SVG */
  accent?: string
}

/** 배너 배경에서 파생 — 흰색 + 잉크 + 같은 계열 색 2단 */
type BannerPalette = {
  ink: string
  surface: string
  mid: string
  edge: string
  accent: string
}

type BlockTone = 'surface' | 'mid' | 'accent'

const BANNERS: Record<number, BannerSpec> = {
  1: { motif: 'alphabet', label: 'A', accent: '#ff8f57' },
  2: { motif: 'fish', label: 'a', accent: '#ffd166' },
  3: { motif: 'song', label: 'bcd', accent: '#7c3aed' },
  4: { motif: 'rhyme', label: 'cat' },
  5: { motif: 'story', label: '▶' },
  6: { motif: 'magic', label: 'e' },
  7: { motif: 'quiz', label: '?' },
  8: { motif: 'cards', label: 'the' },
  9: { motif: 'rocket', label: 'bl' },
  10: { motif: 'rhyme', label: 'hat' },
  11: { motif: 'song', label: 'bcd', accent: '#7c3aed' },
  12: { motif: 'mole', label: 'e' },
  13: { motif: 'alphabet', label: 'Aa', accent: '#ff8f57' },
  14: { motif: 'cards', label: 'CVC' },
  15: { motif: 'rhyme', label: 'ai' },
  16: { motif: 'cards', label: 'see' },
  17: { motif: 'story', label: 'web' },
  18: { motif: 'maze', label: 'ar' },
  19: { motif: 'rocket', label: 'i' },
  20: { motif: 'cards', label: 'o' },
  21: { motif: 'mole', label: 'u' },
  22: { motif: 'quiz', label: 'wh' },
  23: { motif: 'song', label: 'aei', accent: '#e11d48' },
  24: { motif: 'fish', label: 'fl', accent: '#ffd166' },
  25: { motif: 'bingo', label: '★' },
  26: { motif: 'maze', label: 'ow' },
  27: { motif: 'story', label: '▶' },
  28: { motif: 'maze', label: 'or' },
}

const FALLBACK: BannerSpec = { motif: 'alphabet', label: 'A' }

function darkenHex(hex: string, amount: number): string {
  const n = Number.parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amount)))
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amount)))
  const b = Math.max(0, Math.round((n & 255) * (1 - amount)))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function paletteFromBanner(bannerColor: string): BannerPalette {
  return {
    ink: '#191b23',
    surface: '#ffffff',
    mid: darkenHex(bannerColor, 0.14),
    edge: darkenHex(bannerColor, 0.26),
    accent: darkenHex(bannerColor, 0.36),
  }
}

function blockFill(palette: BannerPalette, tone: BlockTone): string {
  if (tone === 'accent') return palette.accent
  if (tone === 'mid') return palette.mid
  return palette.surface
}

function blockLabelFill(palette: BannerPalette, tone: BlockTone): string {
  return tone === 'surface' ? palette.ink : palette.surface
}

/** 컬러 배너 — 알파벳 블록 (흰 2 + accent 1, 부드러운 그림자) */
function ColorfulAlphabet({ accent }: { accent: string }) {
  return (
    <>
      <g transform="rotate(11 54 30)">
        <ellipse cx={54} cy={47} rx={12} ry={2.5} fill="#191b23" opacity=".09" />
        <rect x={42} y={22} width={24} height={24} rx={7} fill={accent} />
        <text x={54} y={40} textAnchor="middle" className="event-banner-art-plain" fill="#fff" fontSize="15">
          b
        </text>
      </g>
      <g transform="rotate(-11 18 34)">
        <ellipse cx={18} cy={51} rx={11} ry={2.5} fill="#191b23" opacity=".09" />
        <rect x={6} y={28} width={24} height={24} rx={7} fill="#fff" />
        <text x={18} y={46} textAnchor="middle" className="event-banner-art-plain" fontSize="15">
          A
        </text>
      </g>
      <g transform="rotate(-2 36 58)">
        <ellipse cx={36} cy={73} rx={12} ry={2.5} fill="#191b23" opacity=".09" />
        <rect x={24} y={50} width={24} height={22} rx={7} fill="#fff" />
        <text x={36} y={66} textAnchor="middle" className="event-banner-art-plain" fontSize="15">
          C
        </text>
      </g>
    </>
  )
}

/** 컬러 배너 — 단모음 a 낚시 */
function ColorfulFish({ tailColor }: { tailColor: string }) {
  const ink = '#191b23'
  return (
    <>
      <ellipse cx={40} cy={58} rx={22} ry={3} fill={ink} opacity=".08" />
      <path d="M10 38 2 30v16Z" fill={tailColor} />
      <ellipse cx={38} cy={38} rx={28} ry={20} fill="#fff" />
      <path
        d="M12 38c0-14 52-14 64 0-10 6-28 8-40 4-8-2-14-4-24-4Z"
        fill="#6dd3cf"
      />
      <circle cx={58} cy={34} r={2.5} fill={ink} />
    </>
  )
}

/** 컬러 배너 — 파닉스 송 */
function ColorfulSong({ accent, label }: { accent: string; label: string }) {
  const ink = '#191b23'
  return (
    <>
      <ellipse cx={34} cy={62} rx={18} ry={2.5} fill={ink} opacity=".08" />
      <circle cx={34} cy={30} r={20} fill="#fff" />
      <ellipse cx={26} cy={34} rx={7} ry={5} fill={ink} transform="rotate(-28 26 34)" />
      <rect x={30.5} y={12} width={3.5} height={24} rx={1.75} fill={ink} />
      <path d="M34 12h16v7H34Z" fill={ink} />
      <rect x={50} y={18} width={3.5} height={26} rx={1.75} fill={accent} />
      <circle cx={51.75} cy={46} r={5} fill={accent} />
      <text x={34} y={62} textAnchor="middle" className="event-banner-art-plain" fontSize="11">
        {label}
      </text>
    </>
  )
}

/** 단색 입체 블록 — 그라데이션 없이 앞·옆면만 */
function Block3D({
  x,
  y,
  size,
  depth = 4,
  rotate = 0,
  label,
  palette,
  tone = 'surface',
}: {
  x: number
  y: number
  size: number
  depth?: number
  rotate?: number
  label: string
  palette: BannerPalette
  tone?: BlockTone
}) {
  const r = size * 0.2
  const cx = x + size / 2
  const cy = y + size / 2
  const front = blockFill(palette, tone)
  const labelFill = blockLabelFill(palette, tone)

  return (
    <g transform={`rotate(${rotate} ${cx} ${cy})`}>
      <rect x={x + depth} y={y + depth} width={size} height={size} rx={r} fill={palette.edge} />
      <rect x={x} y={y} width={size} height={size} rx={r} fill={front} stroke={palette.ink} strokeWidth="1.2" />
      <text x={cx} y={cy + 5} textAnchor="middle" className="event-banner-art-block-label" fill={labelFill}>
        {label}
      </text>
    </g>
  )
}

function MotifIcon({ spec, palette }: { spec: BannerSpec; palette: BannerPalette }) {
  switch (spec.motif) {
    case 'fish':
      if (spec.accent) {
        return <ColorfulFish tailColor={spec.accent} />
      }
      return (
        <>
          <ellipse cx={38} cy={54} rx={28} ry={5} fill={palette.ink} opacity=".12" />
          <path
            d="M20 38c14-12 38-12 52 0-14 12-38 12-52 0Z"
            fill={palette.mid}
            stroke={palette.ink}
            strokeWidth="1.2"
          />
          <path d="M18 38 6 28v20Z" fill={palette.accent} stroke={palette.ink} strokeWidth="1" />
          <circle cx={58} cy={35} r={3} fill={palette.ink} />
          <text x={40} y={42} textAnchor="middle" className="event-banner-art-letter" fill={palette.surface}>
            {spec.label}
          </text>
        </>
      )
    case 'song':
      if (spec.accent) {
        return <ColorfulSong accent={spec.accent} label={spec.label} />
      }
      return (
        <>
          <circle cx={28} cy={36} r={16} fill={palette.mid} stroke={palette.ink} strokeWidth="1.2" />
          <path
            d="M36 24v26c0 5-4 9-9 9s-9-4-9-9 4-9 9-9c2 0 4 1 5 2V24Z"
            fill={palette.accent}
          />
          <rect x={44} y={18} width={20} height={10} rx={3} fill={palette.accent} stroke={palette.ink} strokeWidth="1" />
          <path d="M58 18v28" stroke={palette.ink} strokeWidth="4" strokeLinecap="round" />
          <circle cx={58} cy={48} r={4.5} fill={palette.accent} stroke={palette.ink} strokeWidth="1" />
        </>
      )
    case 'rhyme':
      return (
        <>
          <path d="M10 52c12-10 36-10 48 0" fill="none" stroke={palette.accent} strokeWidth="4" strokeLinecap="round" />
          <circle cx={24} cy={40} r={10} fill={palette.mid} stroke={palette.ink} strokeWidth="1.2" />
          <circle cx={52} cy={40} r={10} fill={palette.accent} stroke={palette.ink} strokeWidth="1.2" />
          <text x={38} y={70} textAnchor="middle" className="event-banner-art-small" fill={palette.ink}>
            {spec.label}
          </text>
        </>
      )
    case 'story':
      return (
        <>
          <rect x={12} y={20} width={52} height={36} rx={8} fill={palette.mid} stroke={palette.ink} strokeWidth="1.2" />
          <path d="M32 30v16l14-8Z" fill={palette.accent} stroke={palette.ink} strokeWidth="0.8" />
        </>
      )
    case 'magic':
      return (
        <>
          <Block3D x={8} y={30} size={22} label="a" palette={palette} rotate={-8} tone="mid" />
          <Block3D x={46} y={30} size={22} label="e" palette={palette} rotate={8} tone="accent" />
          <path d="M16 60 60 22" stroke={palette.ink} strokeWidth="3" strokeLinecap="round" />
          <path
            d="m54 20 4 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"
            fill={palette.accent}
            stroke={palette.ink}
            strokeWidth="0.8"
          />
        </>
      )
    case 'quiz':
      return (
        <>
          <Block3D x={8} y={24} size={24} label="sh" palette={palette} rotate={-6} tone="mid" />
          <Block3D x={42} y={24} size={24} label="ch" palette={palette} rotate={6} tone="accent" />
          <circle cx={38} cy={62} r={9} fill={palette.accent} stroke={palette.ink} strokeWidth="1.2" />
          <text x={38} y={66} textAnchor="middle" className="event-banner-art-medium" fill={palette.surface}>
            ?
          </text>
        </>
      )
    case 'rocket':
      return (
        <>
          <path
            d="M38 14c12 10 14 28 6 42H32C24 42 26 26 38 14Z"
            fill={palette.mid}
            stroke={palette.ink}
            strokeWidth="1.2"
          />
          <circle cx={38} cy={30} r={6} fill={palette.accent} stroke={palette.ink} strokeWidth="1" />
          <path d="M30 52 22 66l16-7 16 7-8-14Z" fill={palette.accent} stroke={palette.ink} strokeWidth="1" />
        </>
      )
    case 'mole':
      return (
        <>
          <ellipse cx={38} cy={62} rx={24} ry={5} fill={palette.ink} opacity=".12" />
          <path
            d="M20 48c2-14 36-14 40 0v14H20Z"
            fill={palette.mid}
            stroke={palette.ink}
            strokeWidth="1.2"
          />
          <circle cx={30} cy={46} r={2.5} fill={palette.ink} />
          <circle cx={46} cy={46} r={2.5} fill={palette.ink} />
          <ellipse cx={38} cy={52} rx={8} ry={4} fill={palette.accent} opacity=".35" />
          <Block3D x={28} y={20} size={22} label={spec.label} palette={palette} tone="accent" />
        </>
      )
    case 'bingo':
      return (
        <>
          <rect x={12} y={16} width={52} height={48} rx={8} fill={palette.mid} stroke={palette.ink} strokeWidth="1.2" />
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={18 + col * 14}
                y={22 + row * 14}
                width={10}
                height={10}
                rx={2}
                fill={(row + col) % 2 ? palette.accent : palette.edge}
                stroke={palette.ink}
                strokeWidth="0.6"
              />
            )),
          )}
        </>
      )
    case 'maze':
      return (
        <>
          <rect x={14} y={18} width={48} height={44} rx={7} fill={palette.mid} stroke={palette.ink} strokeWidth="1.2" />
          <path d="M22 26h32v8H30v8h24v8H22V42h10V34H22Z" fill={palette.accent} />
          <circle cx={22} cy={26} r={3.5} fill={palette.ink} />
          <circle cx={54} cy={50} r={3.5} fill={palette.ink} />
        </>
      )
    case 'cards':
      return (
        <>
          <Block3D x={10} y={30} size={24} label="A" palette={palette} rotate={-8} tone="mid" />
          <Block3D x={40} y={26} size={26} label={spec.label.slice(0, 3)} palette={palette} rotate={8} tone="accent" />
        </>
      )
    case 'alphabet':
    default:
      if (spec.accent) {
        return <ColorfulAlphabet accent={spec.accent} />
      }
      return (
        <>
          <Block3D x={8} y={26} size={24} label="A" palette={palette} rotate={-10} tone="accent" />
          <Block3D x={44} y={22} size={24} label="b" palette={palette} rotate={8} tone="mid" />
          <Block3D x={24} y={48} size={24} label="C" palette={palette} rotate={-4} tone="accent" />
        </>
      )
  }
}

/** "이달의 신규 파닉스" 배너 — 배경색에 맞춘 단색 3D SVG */
export function EventBannerArt({
  item,
  bannerColor = '#fff200',
  className = '',
}: {
  item: GalleryItem
  bannerColor?: string
  className?: string
}) {
  const spec = BANNERS[item.id] ?? FALLBACK
  const palette = paletteFromBanner(bannerColor)

  return (
    <svg
      className={`event-banner-art event-banner-art-svg ${className}`.trim()}
      viewBox="0 0 76 80"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <MotifIcon spec={spec} palette={palette} />
    </svg>
  )
}
