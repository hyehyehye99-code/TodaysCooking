"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { updateRecipe } from "@/lib/actions/recipes";
import { GlassCard } from "@/components/ui";
import { EmojiPicker } from "@/components/EmojiPicker";
import { TagPicker } from "@/components/TagPicker";
import { PhotoPicker } from "@/components/PhotoPicker";
import type { RecipeWithIngredients } from "@/lib/types";

export function EditRecipeForm({
  recipe,
  referenceUrl,
  existingTags,
}: {
  recipe: RecipeWithIngredients;
  referenceUrl: string;
  existingTags: string[];
}) {
  const [state, formAction, pending] = useActionState(updateRecipe, undefined);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const router = useRouter();
  const ingredientsText = recipe.recipe_ingredients
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((i) => i.name)
    .join("\n");

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[22px] font-bold">메뉴 수정</h1>
        <button
          type="button"
          onClick={() => setConfirmingClose(true)}
          aria-label="닫기"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>

      {confirmingClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmingClose(false)} />
          <div className="relative w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-xl">
            <p className="text-sm font-bold text-ink">수정 중인 내용이 저장되지 않아요</p>
            <p className="mt-2 text-xs text-ink-soft">지금 나가면 수정한 내용이 모두 사라져요. 계속하시겠어요?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmingClose(false)}
                className="rounded-lg bg-surface px-3.5 py-2 text-xs font-bold text-ink-soft"
              >
                계속 작성
              </button>
              <button
                type="button"
                onClick={() => router.push(`/recipes/${recipe.id}`)}
                className="rounded-lg bg-accent px-3.5 py-2 text-xs font-bold text-white"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={recipe.id} />

        <GlassCard className="bg-white p-4">
          <p className="mb-3 text-[13px] font-bold">기본 정보</p>
          <div className="flex flex-col gap-3">
            <input
              name="title"
              required
              defaultValue={recipe.title}
              placeholder="요리 이름"
              className="rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
            />
            <input
              name="subtitle"
              defaultValue={recipe.subtitle ?? ""}
              placeholder="설명 (선택)"
              className="rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
            />
          </div>
        </GlassCard>

        <GlassCard className="bg-white p-4">
          <p className="mb-3 text-[13px] font-bold">사진 또는 이모지</p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-soft">사진 (선택, 최대 5장)</span>
              <PhotoPicker name="photos" existingUrls={recipe.cover_photo_urls} />
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-soft">아이콘 이모지 (사진이 없을 때 표시돼요)</span>
              <EmojiPicker name="iconEmoji" defaultValue={recipe.icon_emoji} />
            </label>
          </div>
        </GlassCard>

        <GlassCard className="bg-white p-4">
          <p className="mb-3 text-[13px] font-bold">태그</p>
          <TagPicker name="tags" existingTags={existingTags} defaultSelected={recipe.tags} />
        </GlassCard>

        <GlassCard className="bg-white p-4">
          <p className="mb-1 text-[13px] font-bold">참고 링크</p>
          <p className="mb-3 text-xs text-ink-soft">여기 넣은 링크는 보관함 탭에도 함께 저장돼요</p>
          <input
            name="referenceUrl"
            type="url"
            defaultValue={referenceUrl}
            placeholder="https://..."
            className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
        </GlassCard>

        <GlassCard className="bg-white p-4">
          <p className="mb-1 text-[13px] font-bold">재료</p>
          <p className="mb-3 text-xs text-ink-soft">한 줄에 하나씩 입력해주세요</p>
          <textarea
            name="ingredients"
            required
            rows={12}
            defaultValue={ingredientsText}
            className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
        </GlassCard>

        <GlassCard className="bg-white p-4">
          <p className="mb-3 text-[13px] font-bold">만드는법</p>
          <textarea
            name="notes"
            rows={8}
            defaultValue={recipe.notes ?? ""}
            placeholder="예) 다음엔 국물을 더 자작하게, 마늘은 좀 줄이기"
            className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
        </GlassCard>

        {state?.error && <p className="text-sm text-warn-ink">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-xl bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "저장 중..." : "저장하기"}
        </button>
      </form>
    </div>
  );
}
