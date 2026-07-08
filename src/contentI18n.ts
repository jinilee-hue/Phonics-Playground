import type { Lang } from './i18n'

/**
 * 갤러리 콘텐츠(게임 제목·설명·게임종류 라벨) ko→en 매핑.
 * 실제 서비스에선 백엔드가 언어별 콘텐츠를 내려주지만, 디자인 목에선 여기서 치환한다.
 * 매핑에 없는 문자열은 원문(한글) 그대로 반환한다.
 */
const CONTENT_EN: Record<string, string> = {
  // 제목
  '알파벳 사운드 매칭': 'Alphabet Sound Match',
  '단모음 a 낚시': 'Short Vowel A Fishing',
  '파닉스 송 — 자음편': 'Phonics Song — Consonants',
  '라이밍 워드 사운드': 'Rhyming Word Sounds',
  '유튜브 파닉스 스토리': 'YouTube Phonics Story',
  '장모음 매직 e': 'Magic E Long Vowels',
  '이중자음 디그래프 퀴즈': 'Digraph Quiz',
  '사이트 워드 스피드런': 'Sight Word Speedrun',
  '자음 블렌드 로켓': 'Consonant Blend Rocket',
  '단모음 e 두더지': 'Short Vowel E Whack-a-Mole',
  '알파벳 대소문자 매칭': 'Uppercase & Lowercase Match',
  'CVC 단어 만들기': 'Build CVC Words',
  '이중모음 오디오 카드': 'Vowel Team Audio Cards',
  '사이트 워드 플래시': 'Sight Word Flash',
  '외부 파닉스 게임 링크': 'External Phonics Game Link',
  'r-통제 모음 사파리': 'R-Controlled Vowel Safari',
  '단모음 i 우주선': 'Short Vowel I Spaceship',
  '단모음 o 통통': 'Short Vowel O Bounce',
  '단모음 u 두더지': 'Short Vowel U Whack-a-Mole',
  '이중자음 wh 퀴즈': 'Digraph WH Quiz',
  '파닉스 송 — 모음편': 'Phonics Song — Vowels',
  '블렌드 fl·gl 낚시': 'FL·GL Blend Fishing',
  '사이트 워드 빙고': 'Sight Word Bingo',
  '이중모음 ou·ow 탐험': 'OU·OW Vowel Team Explorer',
  '외부 파닉스 영상 링크': 'External Phonics Video Link',
  'r-통제 모음 or·ar 미로': 'R-Controlled OR·AR Maze',

  // 설명
  '글자와 소리를 짝지어 보는 인터랙티브 게임': 'An interactive game matching letters to sounds',
  '단모음 a가 들어간 단어를 낚아 올리세요': 'Reel in words with the short vowel A',
  '자음 소리를 노래로 익히는 영상': 'A video for learning consonant sounds through song',
  '같은 운으로 끝나는 단어 소리 듣기': 'Listen to words that end with the same rhyme',
  '외부 영상으로 배우는 파닉스 이야기': 'A phonics story taught with an external video',
  'magic e 규칙을 드래그로 익히는 게임': 'Learn the magic E rule by dragging',
  'sh, ch, th 소리를 구분하는 퀴즈': 'A quiz to tell apart sh, ch, th sounds',
  '고빈도 단어를 빠르게 읽는 미니 게임': 'A mini game for reading high-frequency words fast',
  'bl, cr, st 블렌드로 로켓을 발사하세요': 'Launch the rocket with bl, cr, st blends',
  '같은 운으로 끝나는 단어 듣기': 'Listen to words ending with the same rhyme',
  '단모음 e 단어가 나오면 두더지를 잡으세요': 'Whack the mole when a short-vowel E word appears',
  '대문자와 소문자를 짝지어 보세요': 'Match uppercase and lowercase letters',
  '자음-모음-자음으로 단어를 조합해요': 'Build words with consonant-vowel-consonant',
  'ai, ea, oa 소리를 듣고 따라 말해요': 'Listen to ai, ea, oa sounds and repeat',
  '고빈도 단어를 플래시 카드로 반복': 'Repeat high-frequency words with flash cards',
  '추천 외부 파닉스 웹 게임으로 이동': 'Go to a recommended external phonics web game',
  'ar, er, ir 소리를 찾는 사파리 게임': 'A safari game to find ar, er, ir sounds',
  '단모음 i 단어를 모아 우주선을 채워요': 'Collect short-vowel I words to fill the spaceship',
  '단모음 o 단어가 나오면 통통 튀겨요': 'Bounce when a short-vowel O word appears',
  '단모음 u 단어를 빠르게 눌러요': 'Tap short-vowel U words quickly',
  'wh 소리를 찾는 듣기 퀴즈': 'A listening quiz to find the wh sound',
  '모음 소리를 노래로 익히는 영상': 'A video for learning vowel sounds through song',
  'fl, gl 블렌드 단어를 낚아요': 'Catch words with fl, gl blends',
  '고빈도 단어로 빙고를 완성해요': 'Complete bingo with high-frequency words',
  'ou, ow 소리를 찾아 탐험해요': 'Explore to find ou, ow sounds',
  '추천 외부 파닉스 영상으로 이동': 'Go to a recommended external phonics video',
  'or, ar 소리를 따라 미로를 통과해요': 'Follow or, ar sounds through the maze',

  // 게임종류(스킬 라벨)
  '알파벳 인지': 'Letter Recognition',
  '단모음 a': 'Short Vowel A',
  '자음 소리': 'Consonant Sounds',
  '워드 패밀리': 'Word Family',
  '자음 블렌드': 'Consonant Blend',
  '매직 e': 'Magic E',
  디그래프: 'Digraph',
  '사이트 워드': 'Sight Word',
  '단모음 e': 'Short Vowel E',
  대소문자: 'Letter Case',
  'CVC 조합': 'CVC Build',
  이중모음: 'Vowel Team',
  '종합 복습': 'Review',
  'r-통제 모음': 'R-Controlled Vowel',
  '단모음 i': 'Short Vowel I',
  '단모음 o': 'Short Vowel O',
  '단모음 u': 'Short Vowel U',
  '디그래프 wh': 'Digraph WH',
  '모음 소리': 'Vowel Sounds',
  '종합 영상': 'Overview Video',
}

/** 언어에 맞춰 콘텐츠 문자열을 반환(en이고 매핑 있으면 영어, 아니면 원문). */
export function translateContent(text: string | null | undefined, lang: Lang): string {
  if (!text) return ''
  return lang === 'en' ? CONTENT_EN[text] ?? text : text
}
