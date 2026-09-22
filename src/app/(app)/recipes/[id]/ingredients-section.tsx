"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setIngredientState, type IngredientChipState } from "@/lib/actions/recipes";
import * as guestStore from "@/lib/guest/store";
import { IngredientChip } from "@/components/IngredientChip";
import { SavedToast } from "@/components/SavedToast";
import { Mascot } from "@/components/Mascot";
import { useDict } from "@/lib/i18n/client";

type Ingredient = { id: string; name: string; amount: string | null; initialState: IngredientChipState };

// Buffered, same as a meal plan's ingredient chips (see explore/[id]/meal-
// plan-panel.tsx) — taps just update local state here, and "저장" is what
// actually writes to fridge/shopping stock, so a stray tap can't silently
// add something to the shopping list.
export function IngredientsSection({
  recipeId,
  ingredients,
  ownedCount,
  totalCount,
  guest = false,
}: {
  recipeId: string;
  ingredients: Ingredient[];
  ownedCount: number;
  totalCount: number;
  guest?: boolean;
}) {
  const dict = useDict();
  const router = useRouter();
  const [pending, setPending] = useState<Record<string, IngredientChipState>>({});
  const [saving, startSaving] = useTransition();
  const [savedTrigger, setSavedTrigger] = useState(0);

  function handleChange(name: string, next: IngredientChipState) {
    setPending((prev) => ({ ...prev, [name]: next }));
  }

  function save() {
    const entries = Object.entries(pending);
    if (entries.length === 0) return;
    if (guest) {
      // Local store: the update re-renders the parent with fresh chip states.
      guestStore.setIngredientStates(recipeId, entries);
      setPending({});
      setSavedTrigger((t) => t + 1);
      return;
    }
    startSaving(async () => {
      await Promise.all(entries.map(([name, state]) => setIngredientState(recipeId, name, state)));
      setPending({});
      setSavedTrigger((t) => t + 1);
      router.refresh();
    });
  }

  const hasPending = Object.keys(pending).length > 0;

  return (
    <div className="mt-5">
      <SavedToast message={dict.recipes.ingredientsSavedMessage} trigger={savedTrigger} />

      <p className="mb-2 flex items-center gap-1.5">
        <span className="text-[15px] font-bold">{dict.welcome.ingredients}</span>
        <span className="text-xs text-ink-faint">
          {dict.recipes.ownedCountTemplate.replace("{owned}", String(ownedCount)).replace("{total}", String(totalCount))}
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {ingredients.map((ing) => (
          <IngredientChip
            key={ing.id}
            name={ing.name}
            amount={ing.amount}
            state={pending[ing.name] ?? ing.initialState}
            onChange={(next) => handleChange(ing.name, next)}
          />
        ))}
      </div>

      {hasPending && (
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving && <Mascot name="cooking" size={18} className="animate-icon-pulse" />}
          {saving ? dict.recipes.addingEllipsis : dict.mealPlan.saveChangesButton}
        </button>
      )}
    </div>
  );
}
