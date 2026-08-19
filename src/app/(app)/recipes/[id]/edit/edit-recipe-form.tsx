"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateRecipe } from "@/lib/actions/recipes";
import { GlassCard } from "@/components/ui";
import { EmojiPicker } from "@/components/EmojiPicker";
import { TagPicker } from "@/components/TagPicker";
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
  const ingredientsText = recipe.recipe_ingredients
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((i) => i.name)
    .join("\n");

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[22px] font-bold">레시피 수정</h1>
        <Link
          href={`/recipes/${recipe.id}`}
          aria-label="닫기"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </Link>
      </div>

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
            {recipe.cover_photo_url && (
              <div className="h-14 w-14 overflow-hidden rounded-2xl bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={recipe.cover_photo_url} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-soft">사진 바꾸기 (선택)</span>
              <input type="file" name="photo" accept="image/*" className="text-xs text-ink-soft" />
            </label>
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
            rows={6}
            defaultValue={ingredientsText}
            className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
        </GlassCard>

        <GlassCard className="bg-white p-4">
          <p className="mb-3 text-[13px] font-bold">메모</p>
          <textarea
            name="notes"
            rows={4}
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
