"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setIngredientState, type IngredientChipState } from "@/lib/actions/recipes";
import { MealPlanInfoBox } from "./meal-plan-info-box";
import { MealPlanRecipeCard } from "./meal-plan-recipe-card";
import type { MealPlanCardRecipe } from "./meal-plan-card-image";
import { useDict } from "@/lib/i18n/client";

type PlanRecipe = {
  id: string;
  title: string | null;
  displayName: string | null;
  coverPhotoUrl?: string;
  iconEmoji: string | null;
  linkThumbnailUrl?: string | null;
  ingredients: { name: string; amount: string | null; initialState: IngredientChipState }[];
};

// Ingredient names can contain spaces (e.g. "다진 마늘"), but a recipe id
// (UUID) never does, so joining/splitting on the first space is safe.
function pendingKey(recipeId: string, name: string) {
  return `${recipeId} ${name}`;
}

function parsePendingKey(key: string): [recipeId: string, name: string] {
  const spaceIndex = key.indexOf(" ");
  return [key.slice(0, spaceIndex), key.slice(spaceIndex + 1)];
}

// One plan's whole panel: info box, recipe list, and the ingredient chips'
// pending changes — taps just update local state here, and "저장" is what
// actually persists them (recipe detail's chips still save instantly; see
// InstantIngredientChip — a meal plan buffers because there's no longer a
// bulk "장보기에 담기" action forcing an immediate write).
export function MealPlanPanel({
  mealPlanId,
  householdName,
  title,
  eventDate,
  headcount,
  cardRecipes,
  recipes,
  untitledLabel,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  mealPlanId: string;
  householdName: string;
  title: string;
  eventDate: string | null;
  headcount: number | null;
  cardRecipes: MealPlanCardRecipe[];
  recipes: PlanRecipe[];
  untitledLabel: string;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const dict = useDict();
  const router = useRouter();
  const [pending, setPending] = useState<Record<string, IngredientChipState>>({});
  const [saving, startSaving] = useTransition();

  function handleIngredientChange(recipeId: string, name: string, next: IngredientChipState) {
    setPending((prev) => ({ ...prev, [pendingKey(recipeId, name)]: next }));
  }

  function save() {
    const entries = Object.entries(pending);
    if (entries.length === 0) return;
    startSaving(async () => {
      await Promise.all(
        entries.map(([key, state]) => {
          const [recipeId, name] = parsePendingKey(key);
          return setIngredientState(recipeId, name, state);
        })
      );
      setPending({});
      router.refresh();
    });
  }

  const hasPending = Object.keys(pending).length > 0;

  return (
    <div className="animate-fade-in-up pt-2">
      <MealPlanInfoBox
        mealPlanId={mealPlanId}
        householdName={householdName}
        title={title}
        eventDate={eventDate}
        headcount={headcount}
        cardRecipes={cardRecipes}
        onPrev={onPrev}
        onNext={onNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />

      <div className="flex flex-col gap-3">
        {recipes.map((r, index) => (
          <MealPlanRecipeCard
            key={r.id}
            index={index}
            recipeId={r.id}
            mealPlanId={mealPlanId}
            title={r.title}
            displayName={r.displayName}
            untitledLabel={untitledLabel}
            coverPhotoUrl={r.coverPhotoUrl}
            iconEmoji={r.iconEmoji}
            linkThumbnailUrl={r.linkThumbnailUrl}
            ingredients={r.ingredients.map((ing) => ({
              name: ing.name,
              amount: ing.amount,
              state: pending[pendingKey(r.id, ing.name)] ?? ing.initialState,
            }))}
            onIngredientChange={(name, next) => handleIngredientChange(r.id, name, next)}
          />
        ))}
      </div>

      {hasPending && (
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-4 w-full rounded-xl bg-accent py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? dict.recipes.addingEllipsis : dict.mealPlan.saveChangesButton}
        </button>
      )}
    </div>
  );
}
