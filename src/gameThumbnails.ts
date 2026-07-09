/** 영역별 맞춤 파닉스 놀이 — id별 생성 썸네일 (phonics-thumb-{id}-*.png) */
const modules = import.meta.glob('./assets/phonics-thumb-*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const GENERATED_THUMB_BY_ID: Record<number, string> = {}

for (const [path, url] of Object.entries(modules).sort(([a], [b]) => a.localeCompare(b))) {
  const match = path.match(/phonics-thumb-(\d+)-/)
  if (match) {
    const id = Number(match[1])
    if (!(id in GENERATED_THUMB_BY_ID)) GENERATED_THUMB_BY_ID[id] = url
  }
}

export function getGeneratedThumbUrl(id: number): string | undefined {
  return GENERATED_THUMB_BY_ID[id]
}
