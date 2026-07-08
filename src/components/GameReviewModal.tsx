import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../api/client'
import type { GalleryItem, GalleryOut, RatingOut } from '../api/types'
import face0 from '../assets/character1.png'
import face1 from '../assets/character2.png'
import face2 from '../assets/character3.png'
import face3 from '../assets/character4.png'
import face4 from '../assets/character5.png'
import face5 from '../assets/character6.png'
import starOn from '../assets/review-star-on.png'
import starOff from '../assets/review-star-off.png'

/** 별점(0~5)별 캐릭터 이미지·문구 — 0★→character1 … 5★→character6 */
const FACES = [face0, face1, face2, face3, face4, face5]
const PROMPTS = [
  '별을 눌러 평가해주세요!',
  '더 재미있게 만들어주세요!',
  '조금 아쉬워요!',
  '괜찮아요!',
  '재미있어요!',
  '완전 최고예요!',
]
const CHIPS = ['재밌어요!', '어려워요', '또 하고 싶어요!', '쉬워요', '없어요']

/**
 * 게임 종료 시 게임창(PlayModal) 안에서 뜨는 리뷰 팝업 (Figma Playground_Review).
 * 취소 → 게임으로 복귀(onCancel), 평가 완료 → 별점 저장 후 종료(onDone).
 */
export function GameReviewModal({
  item,
  onCancel,
  onDone,
}: {
  item: GalleryItem
  onCancel: () => void
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(item.myRating ?? 0)
  const [hover, setHover] = useState(0)
  const [tags, setTags] = useState<Set<string>>(new Set())

  const { mutate: rate, isPending } = useMutation({
    mutationFn: (score: number) => api.post<RatingOut>(`/api/contents/${item.id}/rate`, { score }),
    onSuccess: (result) => {
      // 갤러리 캐시의 해당 item만 낙관적 갱신(카드·모달에 즉시 반영)
      queryClient.setQueryData<GalleryOut>(['gallery'], (prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((it) =>
                it.id === item.id
                  ? { ...it, ratingAvg: result.avg, ratingCount: result.count, myRating: result.myRating }
                  : it,
              ),
            }
          : prev,
      )
      onDone()
    },
  })

  // 별 위에 마우스를 올리면 미리보기(hover), 아니면 선택값(rating)으로 얼굴·문구 표시
  const shown = hover || rating

  const toggleTag = (tag: string) =>
    setTags((prev) => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#102a43]/55 p-4 backdrop-blur-sm">
      <div className="flex max-h-full w-[560px] max-w-full flex-col items-center overflow-y-auto rounded-[20px] bg-white px-8 pb-6 pt-11 shadow-2xl">
        <h3 className="text-center text-[24px] font-extrabold text-[#102a43]">오늘 게임은 어땠나요?</h3>

        {/* 별점 */}
        <div
          className="mt-4 flex gap-2.5"
          role="radiogroup"
          aria-label="별점"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n}점`}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
              className="transition-transform hover:scale-110"
            >
              <img
                src={n <= shown ? starOn : starOff}
                alt=""
                className={`h-[38px] w-[38px] object-contain ${n <= shown ? 'scale-[1.28]' : ''}`}
              />
            </button>
          ))}
        </div>

        {/* 얼굴 + 문구 */}
        <img
          src={FACES[shown]}
          alt=""
          className="mt-3 h-[100px] w-[100px] object-contain"
          aria-hidden="true"
        />
        <p className="mt-2 text-center text-[20px] font-extrabold text-[#0ea5e9]">{PROMPTS[shown]}</p>

        {/* 소감 칩 */}
        <div className="mt-6 w-full rounded-[20px] bg-[#e6f3fd] px-5 py-5">
          <p className="text-center text-[20px] font-extrabold text-[#102a43]">
            더 하고 싶은 말이 있나요?
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {CHIPS.map((chip) => {
              const on = tags.has(chip)
              return (
                <button
                  key={chip}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleTag(chip)}
                  className={`rounded-full border-2 px-[26px] py-[14px] text-[16px] font-bold shadow-[0px_6px_0px_#bfe0f5] transition ${
                    on
                      ? 'border-[#0ea5e9] bg-[#e0f2fe] text-[#0ea5e9]'
                      : 'border-white bg-white text-[#102a43]'
                  }`}
                >
                  {chip}
                </button>
              )
            })}
          </div>
        </div>

        {/* 버튼 */}
        <div className="mt-6 flex w-full gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="h-[60px] flex-1 rounded-full bg-[#999999] text-[20px] font-extrabold text-white transition hover:bg-[#8a8a8a] disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => rate(rating)}
            disabled={rating === 0 || isPending}
            className={`h-[60px] flex-1 rounded-full text-[20px] font-extrabold text-white transition ${
              rating === 0 ? 'cursor-not-allowed bg-[#999999]' : 'bg-[#0ea5e9] hover:bg-[#0284c7]'
            }`}
          >
            {rating === 5 ? '리뷰 저장' : '평가 완료'}
          </button>
        </div>
      </div>
    </div>
  )
}
