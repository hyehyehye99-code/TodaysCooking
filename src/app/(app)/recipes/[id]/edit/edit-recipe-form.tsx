"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateRecipe } from "@/lib/actions/recipes";
import { PageHeader } from "@/components/ui";
import { EmojiPicker } from "@/components/EmojiPicker";
import type { RecipeWithIngredients } from "@/lib/types";

export function EditRecipeForm({
  recipe,
  referenceUrl,
}: {
  recipe: RecipeWithIngredients;
  referenceUrl: string;
}) {
  const [state, formAction, pending] = useActionState(updateRecipe, undefined);
  const ingredientsText = recipe.recipe_ingredients
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((i) => i.name)
    .join("\n");

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <PageHeader title="레시피 수정" />
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

        {recipe.cover_photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.cover_photo_url}
            alt=""
            className="h-32 w-full rounded-xl object-cover"
          />
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-ink-soft">사진 바꾸기 (선택)</span>
          <input type="file" name="photo" accept="image/*" className="text-xs text-ink-soft" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-ink-soft">아이콘 이모지 (사진이 없을 때 표시돼요)</span>
          <EmojiPicker name="iconEmoji" defaultValue={recipe.icon_emoji} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-ink-soft">요리 이름</span>
          <input
            name="title"
            required
            defaultValue={recipe.title}
            className="rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-ink-soft">설명 (선택)</span>
          <input
            name="subtitle"
            defaultValue={recipe.subtitle ?? ""}
            className="rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-ink-soft">레시피 참고 링크 (선택)</span>
          <input
            name="referenceUrl"
            type="url"
            defaultValue={referenceUrl}
            placeholder="https://..."
            className="rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
          <span className="text-[11px] text-ink-faint">여기 넣은 링크는 북마크 탭에도 함께 저장돼요</span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-ink-soft">태그 (쉼표로 구분, 선택)</span>
          <input
            name="tags"
            defaultValue={recipe.tags.join(", ")}
            placeholder="예) 한식, 국물요리, 매운맛"
            className="rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-ink-soft">재료 (한 줄에 하나씩)</span>
          <textarea
            name="ingredients"
            required
            rows={6}
            defaultValue={ingredientsText}
            className="rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-ink-soft">메모 (선택)</span>
          <textarea
            name="notes"
            rows={4}
            defaultValue={recipe.notes ?? ""}
            placeholder="예) 다음엔 국물을 더 자작하게, 마늘은 좀 줄이기"
            className="rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
        </label>

        {state?.error && <p className="text-sm text-warn-ink">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-xl bg-accent py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "저장 중..." : "저장하기"}
        </button>
      </form>
    </div>
  );
}
