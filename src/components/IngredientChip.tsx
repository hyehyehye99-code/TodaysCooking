"use client";

import { useDict } from "@/lib/i18n/client";
import type { IngredientChipState } from "@/lib/actions/recipes";

export type { IngredientChipState };

export function nextIngredientState(state: IngredientChipState): IngredientChipState {
  if (state === "none") return "fridge";
  if (state === "fridge") return "shopping";
  if (state === "shopping") return "skip";
  return "none";
}

// One tap cycles 없음 → 보유 → 장보기 → 생략 → 없음 — used both on the
// recipe detail page and on a meal plan's per-recipe ingredient list, so a
// single tap always means the same thing everywhere ingredients show up.
// Purely controlled: the caller owns the state and decides when (or
// whether) a tap gets persisted — the recipe detail page saves instantly,
// while a meal plan panel buffers taps behind its own "저장" button.
export function IngredientChip({
  name,
  amount,
  state,
  onChange,
}: {
  name: string;
  amount: string | null;
  state: IngredientChipState;
  onChange: (next: IngredientChipState) => void;
}) {
  const dict = useDict();

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
      onClick={() => onChange(nextIngredientState(state))}
      className={`rounded-full border px-3.5 py-2 text-[13px] font-semibold ${stateClass}`}
    >
      {name}
      {amount && <span className="ml-1 font-normal opacity-70">{amount}</span>}
      {state === "skip" && <span className="ml-1 text-[10px] font-normal">{dict.recipes.skippedSuffix}</span>}
    </button>
  );
}
