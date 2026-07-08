/**
 * 디자인 모드(DESIGN_MODE) 전용 목업 응답.
 * 백엔드 없이 화면을 채우기 위해 `/api/*` 요청을 이 리졸버가 대신 처리한다.
 * client.ts가 DESIGN_MODE일 때만 이 모듈을 태우므로, 평소(dev/build) 동작에는 영향이 없다.
 *
 * 주의: GalleryItem.thumbUrl은 반드시 null(=/c 프록시 재요청 방지 → 카드 플레이스홀더),
 * html/zip의 entryUrl은 about:blank(=/c 프록시 방지).
 */
import type {
  ContentStats,
  GalleryItem,
  GalleryOut,
  LearnerStats,
  PlaySession,
  RatingOut,
  RecentSession,
  StatsBreakdownOut,
  StatsSummary,
  TrendPoint,
  User,
} from './types'
import { DESIGN_USER } from '../designMode'

/** 갤러리 목업 — 형식/레벨/스킬/평점을 다양하게 섞어 필터·정렬 UI가 살아 보이게 한다. */
const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 1,
    title: '알파벳 사운드 매칭',
    description: '글자와 소리를 짝지어 보는 인터랙티브 게임',
    kind: 'html',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-05-02T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP1',
    skillCode: 'PH.LTR.ALPHABET',
    skillLabel: '알파벳 인지',
    uses: 342,
    completions: 271,
    ratingAvg: 4.6,
    ratingCount: 58,
    myRating: 4,
  },
  {
    id: 2,
    title: '단모음 a 낚시',
    description: '단모음 a가 들어간 단어를 낚아 올리세요',
    kind: 'zip',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-05-10T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP2',
    skillCode: 'PH.CVC.SHORT_A',
    skillLabel: '단모음 a',
    uses: 288,
    completions: 190,
    ratingAvg: 4.2,
    ratingCount: 41,
    myRating: null,
  },
  {
    id: 3,
    title: '파닉스 송 — 자음편',
    description: '자음 소리를 노래로 익히는 영상',
    kind: 'video',
    entryUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    externalUrl: null,
    publishedAt: '2026-04-21T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP1',
    skillCode: 'PH.LTR.CONSONANT',
    skillLabel: '자음 소리',
    uses: 512,
    completions: 468,
    ratingAvg: 4.8,
    ratingCount: 96,
    myRating: 5,
  },
  {
    id: 4,
    title: '라이밍 워드 사운드',
    description: '같은 운으로 끝나는 단어 소리 듣기',
    kind: 'audio',
    entryUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    externalUrl: null,
    publishedAt: '2026-03-30T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP3',
    skillCode: 'PH.RHYME.WORD_FAMILY',
    skillLabel: '워드 패밀리',
    uses: 176,
    completions: 88,
    ratingAvg: 3.9,
    ratingCount: 22,
    myRating: null,
  },
  {
    id: 5,
    title: '유튜브 파닉스 스토리',
    description: '외부 영상으로 배우는 파닉스 이야기',
    kind: 'url',
    entryUrl: null,
    externalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    publishedAt: '2026-05-18T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP2',
    skillCode: 'PH.BLEND.CONSONANT',
    skillLabel: '자음 블렌드',
    uses: 231,
    completions: 143,
    ratingAvg: 4.1,
    ratingCount: 37,
    myRating: 3,
  },
  {
    id: 6,
    title: '장모음 매직 e',
    description: 'magic e 규칙을 드래그로 익히는 게임',
    kind: 'html',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-06-01T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP4',
    skillCode: 'PH.VOWEL.MAGIC_E',
    skillLabel: '매직 e',
    uses: 409,
    completions: 355,
    ratingAvg: 4.7,
    ratingCount: 72,
    myRating: null,
  },
  {
    id: 7,
    title: '이중자음 디그래프 퀴즈',
    description: 'sh, ch, th 소리를 구분하는 퀴즈',
    kind: 'html',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-06-12T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP4',
    skillCode: 'PH.DIGRAPH.SH_CH_TH',
    skillLabel: '디그래프',
    uses: 154,
    completions: 61,
    ratingAvg: 3.6,
    ratingCount: 18,
    myRating: null,
  },
  {
    id: 8,
    title: '사이트 워드 스피드런',
    description: '고빈도 단어를 빠르게 읽는 미니 게임',
    kind: 'zip',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-06-20T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP5',
    skillCode: 'PH.SIGHT.HIGH_FREQ',
    skillLabel: '사이트 워드',
    uses: 97,
    completions: 40,
    ratingAvg: 4.3,
    ratingCount: 51,
    myRating: null,
  },
  {
    id: 9,
    title: '자음 블렌드 로켓',
    description: 'bl, cr, st 블렌드로 로켓을 발사하세요',
    kind: 'html',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-06-24T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP2',
    skillCode: 'PH.BLEND.CONSONANT',
    skillLabel: '자음 블렌드',
    uses: 213,
    completions: 168,
    ratingAvg: 4.4,
    ratingCount: 39,
    myRating: null,
  },
  {
    id: 10,
    title: '라이밍 워드 사운드',
    description: '같은 운으로 끝나는 단어 듣기',
    kind: 'audio',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-06-26T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP3',
    skillCode: 'PH.RHYME.WORD_FAMILY',
    skillLabel: '워드 패밀리',
    uses: 176,
    completions: 122,
    ratingAvg: 3.9,
    ratingCount: 22,
    myRating: null,
  },
  {
    id: 11,
    title: '파닉스 송 — 자음편',
    description: '자음 소리를 노래로 익히는 영상',
    kind: 'video',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-06-28T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP1',
    skillCode: 'PH.LTR.CONSONANT',
    skillLabel: '자음 소리',
    uses: 521,
    completions: 402,
    ratingAvg: 4.8,
    ratingCount: 96,
    myRating: 5,
  },
  {
    id: 12,
    title: '단모음 e 두더지',
    description: '단모음 e 단어가 나오면 두더지를 잡으세요',
    kind: 'zip',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-06-30T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP2',
    skillCode: 'PH.CVC.SHORT_E',
    skillLabel: '단모음 e',
    uses: 134,
    completions: 88,
    ratingAvg: 4.0,
    ratingCount: 27,
    myRating: null,
  },
  {
    id: 13,
    title: '알파벳 대소문자 매칭',
    description: '대문자와 소문자를 짝지어 보세요',
    kind: 'html',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-07-01T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP1',
    skillCode: 'PH.LTR.CASE',
    skillLabel: '대소문자',
    uses: 267,
    completions: 221,
    ratingAvg: 4.5,
    ratingCount: 44,
    myRating: null,
  },
  {
    id: 14,
    title: 'CVC 단어 만들기',
    description: '자음-모음-자음으로 단어를 조합해요',
    kind: 'html',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-07-02T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP2',
    skillCode: 'PH.CVC.BUILD',
    skillLabel: 'CVC 조합',
    uses: 198,
    completions: 143,
    ratingAvg: 4.2,
    ratingCount: 33,
    myRating: null,
  },
  {
    id: 15,
    title: '이중모음 오디오 카드',
    description: 'ai, ea, oa 소리를 듣고 따라 말해요',
    kind: 'audio',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-07-03T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP4',
    skillCode: 'PH.VOWEL.DIGRAPH',
    skillLabel: '이중모음',
    uses: 112,
    completions: 74,
    ratingAvg: 3.8,
    ratingCount: 19,
    myRating: null,
  },
  {
    id: 16,
    title: '사이트 워드 플래시',
    description: '고빈도 단어를 플래시 카드로 반복',
    kind: 'video',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-07-04T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP5',
    skillCode: 'PH.SIGHT.FLASH',
    skillLabel: '사이트 워드',
    uses: 305,
    completions: 248,
    ratingAvg: 4.6,
    ratingCount: 63,
    myRating: null,
  },
  {
    id: 17,
    title: '외부 파닉스 게임 링크',
    description: '추천 외부 파닉스 웹 게임으로 이동',
    kind: 'url',
    entryUrl: 'about:blank',
    externalUrl: 'https://example.com',
    publishedAt: '2026-07-05T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP3',
    skillCode: 'PH.MIX.REVIEW',
    skillLabel: '종합 복습',
    uses: 88,
    completions: 51,
    ratingAvg: 4.1,
    ratingCount: 16,
    myRating: null,
  },
  {
    id: 18,
    title: 'r-통제 모음 사파리',
    description: 'ar, er, ir 소리를 찾는 사파리 게임',
    kind: 'zip',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-07-06T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP5',
    skillCode: 'PH.VOWEL.R_CONTROLLED',
    skillLabel: 'r-통제 모음',
    uses: 241,
    completions: 179,
    ratingAvg: 4.4,
    ratingCount: 48,
    myRating: null,
  },
  {
    id: 19,
    title: '단모음 i 우주선',
    description: '단모음 i 단어를 모아 우주선을 채워요',
    kind: 'html',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-07-07T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP2',
    skillCode: 'PH.CVC.SHORT_I',
    skillLabel: '단모음 i',
    uses: 156,
    completions: 101,
    ratingAvg: 4.0,
    ratingCount: 24,
    myRating: null,
  },
  {
    id: 20,
    title: '단모음 o 통통',
    description: '단모음 o 단어가 나오면 통통 튀겨요',
    kind: 'zip',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-07-08T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP2',
    skillCode: 'PH.CVC.SHORT_O',
    skillLabel: '단모음 o',
    uses: 132,
    completions: 90,
    ratingAvg: 4.1,
    ratingCount: 21,
    myRating: null,
  },
  {
    id: 21,
    title: '단모음 u 두더지',
    description: '단모음 u 단어를 빠르게 눌러요',
    kind: 'html',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-07-09T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP2',
    skillCode: 'PH.CVC.SHORT_U',
    skillLabel: '단모음 u',
    uses: 174,
    completions: 121,
    ratingAvg: 4.3,
    ratingCount: 29,
    myRating: null,
  },
  {
    id: 22,
    title: '이중자음 wh 퀴즈',
    description: 'wh 소리를 찾는 듣기 퀴즈',
    kind: 'audio',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-07-10T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP4',
    skillCode: 'PH.DIGRAPH.WH',
    skillLabel: '디그래프 wh',
    uses: 98,
    completions: 60,
    ratingAvg: 3.7,
    ratingCount: 15,
    myRating: null,
  },
  {
    id: 23,
    title: '파닉스 송 — 모음편',
    description: '모음 소리를 노래로 익히는 영상',
    kind: 'video',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-07-11T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP1',
    skillCode: 'PH.LTR.VOWEL',
    skillLabel: '모음 소리',
    uses: 468,
    completions: 351,
    ratingAvg: 4.7,
    ratingCount: 84,
    myRating: null,
  },
  {
    id: 24,
    title: '블렌드 fl·gl 낚시',
    description: 'fl, gl 블렌드 단어를 낚아요',
    kind: 'html',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-07-12T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP2',
    skillCode: 'PH.BLEND.FL_GL',
    skillLabel: '자음 블렌드',
    uses: 143,
    completions: 97,
    ratingAvg: 4.2,
    ratingCount: 26,
    myRating: null,
  },
  {
    id: 25,
    title: '사이트 워드 빙고',
    description: '고빈도 단어로 빙고를 완성해요',
    kind: 'zip',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-07-13T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP5',
    skillCode: 'PH.SIGHT.BINGO',
    skillLabel: '사이트 워드',
    uses: 219,
    completions: 168,
    ratingAvg: 4.5,
    ratingCount: 41,
    myRating: null,
  },
  {
    id: 26,
    title: '이중모음 ou·ow 탐험',
    description: 'ou, ow 소리를 찾아 탐험해요',
    kind: 'html',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-07-14T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP4',
    skillCode: 'PH.VOWEL.OU_OW',
    skillLabel: '이중모음',
    uses: 121,
    completions: 79,
    ratingAvg: 3.9,
    ratingCount: 18,
    myRating: null,
  },
  {
    id: 27,
    title: '외부 파닉스 영상 링크',
    description: '추천 외부 파닉스 영상으로 이동',
    kind: 'url',
    entryUrl: 'about:blank',
    externalUrl: 'https://example.com',
    publishedAt: '2026-07-15T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP3',
    skillCode: 'PH.MIX.VIDEO',
    skillLabel: '종합 영상',
    uses: 76,
    completions: 44,
    ratingAvg: 4.0,
    ratingCount: 13,
    myRating: null,
  },
  {
    id: 28,
    title: 'r-통제 모음 or·ar 미로',
    description: 'or, ar 소리를 따라 미로를 통과해요',
    kind: 'html',
    entryUrl: 'about:blank',
    externalUrl: null,
    publishedAt: '2026-07-16T09:00:00.000Z',
    thumbUrl: null,
    courseCode: 'ECP5',
    skillCode: 'PH.VOWEL.OR_AR',
    skillLabel: 'r-통제 모음',
    uses: 188,
    completions: 140,
    ratingAvg: 4.3,
    ratingCount: 34,
    myRating: null,
  },
]

/** 오늘로부터 과거 n일치 YYYY-MM-DD 배열(오름차순). 브라우저 런타임이라 Date 사용 가능. */
function recentDates(n: number): string[] {
  const out: string[] = []
  const today = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

function buildTrends(): TrendPoint[] {
  // 완만한 변동을 결정적으로 생성(랜덤 미사용 → 새로고침해도 동일)
  return recentDates(30).map((date, i) => {
    const plays = 40 + ((i * 7 + 13) % 35)
    const completions = Math.round(plays * (0.55 + ((i * 3) % 20) / 100))
    return { date, plays, completions }
  })
}

const STATS_SUMMARY: StatsSummary = {
  totalPlays: 2209,
  activeLearners: 148,
  activeNow: 6,
  overallCompletionRate: 0.71,
  avgDurationSeconds: 214,
  distinctContent: GALLERY_ITEMS.length,
  avgRating: 4.4,
  totalRatings: 344,
}

const LEARNERS: LearnerStats[] = Array.from({ length: 14 }, (_, i) => {
  const plays = 60 - i * 3
  const completions = Math.round(plays * (0.5 + ((i * 5) % 40) / 100))
  return {
    userId: 100 + i,
    userName: `학습자 ${String(i + 1).padStart(2, '0')}`,
    plays,
    distinctContent: 3 + (i % 6),
    completions,
    completionRate: Math.min(1, completions / plays),
    totalDurationSeconds: plays * (120 + (i % 5) * 40),
    ratingsGiven: i % 7,
  }
})

const CONTENT_STATS: ContentStats[] = GALLERY_ITEMS.map((it) => ({
  contentId: it.id,
  title: it.title,
  kind: it.kind,
  uses: it.uses,
  completions: it.completions,
  avgDurationSeconds: 90 + ((it.id * 37) % 240),
  lastPlayedAt: `2026-07-0${(it.id % 7) + 1}T0${(it.id % 8)}:15:00.000Z`,
  ratingAvg: it.ratingAvg,
  ratingCount: it.ratingCount,
}))

const RECENT_SESSIONS: RecentSession[] = Array.from({ length: 16 }, (_, i) => {
  const item = GALLERY_ITEMS[i % GALLERY_ITEMS.length]
  return {
    id: 9000 + i,
    userName: `학습자 ${String((i % 14) + 1).padStart(2, '0')}`,
    contentId: item.id,
    title: item.title,
    startedAt: `2026-07-07T${String(9 + (i % 10)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00.000Z`,
    durationSeconds: 45 + ((i * 53) % 400),
    completed: i % 3 !== 0,
    open: i < 3, // 최근 3건은 진행 중
  }
})

function buildBreakdown(): StatsBreakdownOut {
  const levels = ['ECP1', 'ECP2', 'ECP3', 'ECP4', 'ECP5']
  const skills: { key: string; label: string }[] = [
    { key: 'PH.LTR.ALPHABET', label: '알파벳 인지' },
    { key: 'PH.CVC.SHORT_A', label: '단모음' },
    { key: 'PH.VOWEL.MAGIC_E', label: '장모음' },
    { key: 'PH.DIGRAPH.SH_CH_TH', label: '디그래프' },
    { key: 'PH.SIGHT.HIGH_FREQ', label: '사이트 워드' },
  ]
  const byLevel = levels.map((key, i) => ({
    key,
    label: key,
    contentCount: 2 + (i % 3),
    plays: 300 - i * 40,
    completions: 220 - i * 35,
  }))
  const bySkill = skills.map((s, i) => ({
    key: s.key,
    label: s.label,
    contentCount: 1 + (i % 3),
    plays: 260 - i * 30,
    completions: 190 - i * 28,
  }))
  const byLevelSkill = levels.flatMap((lvl, li) =>
    skills.map((sk, si) => ({
      levelKey: lvl,
      levelLabel: lvl,
      skillKey: sk.key,
      skillLabel: sk.label,
      contentCount: (li + si) % 3,
      plays: ((li * 5 + si * 3) % 9) * 12,
      completions: ((li * 3 + si * 2) % 7) * 9,
    })),
  )
  return { byLevel, bySkill, byLevelSkill }
}

const GALLERY_OUT: GalleryOut = { items: GALLERY_ITEMS, stale: false }

/** 경로(쿼리스트링 제외)로 목업을 매칭해 반환. 매칭 실패 시 null. */
export function resolveMock(method: 'GET' | 'POST', path: string, body?: unknown): unknown {
  const p = path.split('?')[0]

  if (method === 'GET') {
    switch (p) {
      case '/api/gallery':
        return GALLERY_OUT
      case '/api/stats/summary':
        return STATS_SUMMARY
      case '/api/stats/trends':
        return buildTrends()
      case '/api/stats/learners':
        return LEARNERS
      case '/api/stats/contents':
        return CONTENT_STATS
      case '/api/stats/sessions':
        return RECENT_SESSIONS
      case '/api/stats/breakdown':
        return buildBreakdown()
      case '/api/auth/me':
        return DESIGN_USER satisfies User
      default:
        return null
    }
  }

  // POST
  if (/^\/api\/contents\/\d+\/rate$/.test(p)) {
    const score = (body as { score?: number } | undefined)?.score ?? 5
    return { myRating: score, avg: 4.3, count: 61 } satisfies RatingOut
  }
  if (p === '/api/play/sessions') {
    return {
      id: 7777,
      contentId: (body as { contentId?: number } | undefined)?.contentId ?? 1,
      startedAt: '2026-07-07T10:00:00.000Z',
      endedAt: null,
      durationSeconds: 0,
      completed: false,
    } satisfies PlaySession
  }
  if (/^\/api\/play\/sessions\/\d+\/(heartbeat|end|events)$/.test(p)) {
    return null
  }
  if (p === '/api/auth/login' || p === '/api/auth/signup') {
    return DESIGN_USER satisfies User
  }
  if (p === '/api/auth/logout') {
    return null
  }
  return null
}
