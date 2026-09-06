"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui";
import { RecipeThumb } from "@/components/RecipeThumb";
import { IngredientChip, type IngredientChipState } from "@/components/IngredientChip";
import { setMealPlanRecipeDisplayName } from "@/lib/actions/meal-plans";
import { useDict } from "@/lib/i18n/client";

type Ingredient = { name: string; amount: string | null; state: IngredientChipState };

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
  onIngredientChange,
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
  onIngredientChange: (name: string, next: IngredientChipState) => void;
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
            aria-label={dict.mealPlan.renameRecipeButton}
            className="min-w-0 flex-1 truncate text-left text-[15px] font-bold"
          >
            {effectiveTitle}
          </button>
        )}
      </div>
      {ingredients.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ingredients.map((ing) => (
            <IngredientChip
              key={ing.name}
              name={ing.name}
              amount={ing.amount}
              state={ing.state}
              onChange={(next) => onIngredientChange(ing.name, next)}
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
}
