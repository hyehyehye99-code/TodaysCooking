"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setIngredientState, type IngredientChipState } from "@/lib/actions/recipes";
import { SavedToast } from "@/components/SavedToast";
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
// actually persists them (same buffered pattern as the recipe detail page's
// own ingredient chips — see recipes/[id]/ingredients-section.tsx).
export function MealPlanPanel({
  mealPlanId,
  householdName,
  title,
  iconEmoji,
  eventDate,
  headcount,
  cardRecipes,
  recipes,
  untitledLabel,
}: {
  mealPlanId: string;
  householdName: string;
  title: string;
  iconEmoji: string | null;
  eventDate: string | null;
  headcount: number | null;
  cardRecipes: MealPlanCardRecipe[];
  recipes: PlanRecipe[];
  untitledLabel: string;
}) {
  const dict = useDict();
  const router = useRouter();
  const [pending, setPending] = useState<Record<string, IngredientChipState>>({});
  const [saving, startSaving] = useTransition();
  const [savedTrigger, setSavedTrigger] = useState(0);

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
      setSavedTrigger((t) => t + 1);
      router.refresh();
    });
  }

  const hasPending = Object.keys(pending).length > 0;

  return (
    <div className="animate-fade-in-up pt-2">
      <SavedToast message={dict.common.savedMessage} trigger={savedTrigger} />

      <MealPlanInfoBox
        mealPlanId={mealPlanId}
        householdName={householdName}
        title={title}
        iconEmoji={iconEmoji}
        eventDate={eventDate}
        headcount={headcount}
        cardRecipes={cardRecipes}
        recipeCount={recipes.length}
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
