"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui";
import { RecipeThumb } from "@/components/RecipeThumb";
import { IngredientChip, type IngredientChipState } from "@/components/IngredientChip";
import { setMealPlanRecipeDisplayName } from "@/lib/actions/meal-plans";
import { useDict } from "@/lib/i18n/client";

type Ingredient = { name: string; amount: string | null; initialState: IngredientChipState };

export function MealPlanRecipeCard({
  index,
  recipeId,
  mealPlanId,
  title,
  displayName,
  untitledLabel,
  coverPhotoUrl,
  iconEmoji,
  linkThumbnailUrl,
  ingredients,
}: {
  index: number;
  recipeId: string;
  mealPlanId: string;
  title: string | null;
  displayName: string | null;
  untitledLabel: string;
  coverPhotoUrl?: string;
  iconEmoji: string | null;
  linkThumbnailUrl?: string | null;
  ingredients: Ingredient[];
}) {
  const dict = useDict();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const effectiveTitle = displayName || title || untitledLabel;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(effectiveTitle);

  function save() {
    setEditing(false);
    const trimmed = draft.trim();
    // Back to the recipe's own title clears the override instead of saving
    // a redundant copy of it.
    const nextName = trimmed && trimmed !== title ? trimmed : null;
    if (nextName === displayName) return;
    startTransition(async () => {
      await setMealPlanRecipeDisplayName(mealPlanId, recipeId, nextName);
      router.refresh();
    });
  }

  return (
    <GlassCard className="bg-white p-3.5">
      <div className="mb-2.5 flex items-center gap-2.5">
        <Link
          href={`/recipes/${recipeId}?from=${encodeURIComponent(`/explore/${mealPlanId}`)}`}
          className="flex items-center gap-2.5"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-ink-soft">
            {index + 1}
          </span>
          <RecipeThumb
            coverPhotoUrl={coverPhotoUrl}
            iconEmoji={iconEmoji}
            linkThumbnailUrl={linkThumbnailUrl}
            size={36}
            rounded="rounded-lg"
          />
        </Link>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
            }}
            className="min-w-0 flex-1 border-b border-accent bg-transparent text-[15px] font-bold outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(effectiveTitle);
              setEditing(true);
            }}
            className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          >
            <span className="min-w-0 truncate text-[15px] font-bold">{effectiveTitle}</span>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-label={dict.mealPlan.renameRecipeButton}>
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
            </svg>
          </button>
        )}
      </div>
      {ingredients.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ingredients.map((ing) => (
            <IngredientChip
              key={ing.name}
              recipeId={recipeId}
              name={ing.name}
              amount={ing.amount}
              initialState={ing.initialState}
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
}
