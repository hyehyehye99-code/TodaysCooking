"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setIngredientState, type IngredientChipState } from "@/lib/actions/recipes";
import { useDict } from "@/lib/i18n/client";

export type { IngredientChipState };

function nextState(state: IngredientChipState): IngredientChipState {
  if (state === "none") return "fridge";
  if (state === "fridge") return "shopping";
  if (state === "shopping") return "skip";
  return "none";
}

// One tap cycles 없음 → 보유 → 장보기 → 생략 → 없음 — used both on the
// recipe detail page and on a meal plan's per-recipe ingredient list, so a
// single tap always means the same thing everywhere ingredients show up.
export function IngredientChip({
  recipeId,
  name,
  amount,
  initialState,
}: {
  recipeId: string;
  name: string;
  amount: string | null;
  initialState: IngredientChipState;
}) {
  const dict = useDict();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [state, setState] = useOptimistic<IngredientChipState, IngredientChipState>(
    initialState,
    (_prev, next) => next
  );

  function handleClick() {
    const next = nextState(state);
    startTransition(async () => {
      setState(next);
      await setIngredientState(recipeId, name, next);
      router.refresh();
    });
  }

  const stateClass =
    state === "skip"
      ? "border-ink-faint bg-surface text-ink-faint"
      : state === "fridge"
        ? "border-accent bg-surface text-accent-ink"
        : state === "shopping"
          ? "border-positive bg-surface text-positive-ink"
          : "border-transparent bg-surface text-ink-soft";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`rounded-full border px-3.5 py-2 text-[13px] font-semibold ${stateClass}`}
    >
      {name}
      {amount && <span className="ml-1 font-normal opacity-70">{amount}</span>}
      {state === "skip" && <span className="ml-1 text-[10px] font-normal">{dict.recipes.skippedSuffix}</span>}
    </button>
  );
}
