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

function StateIcon({ state }: { state: IngredientChipState }) {
  if (state === "fridge") {
    // 보유 중 — a checkmark, since this is the "already have it" state.
    return (
      <svg viewBox="0 0 14 14" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 7.5l3 3 6-7" />
      </svg>
    );
  }
  if (state === "shopping") {
    // 장보기 — a shopping bag, since this is the "need to buy" state.
    return (
      <svg viewBox="0 0 14 14" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 4.5h8l-.6 7a1 1 0 0 1-1 .9H4.6a1 1 0 0 1-1-.9z" />
        <path d="M5 4.5V3.3a2 2 0 0 1 4 0v1.2" />
      </svg>
    );
  }
  if (state === "skip") {
    // 생략 — a slash, since this state means "not needed for this recipe".
    return (
      <svg viewBox="0 0 14 14" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M3 11l8-8" />
      </svg>
    );
  }
  return null;
}

// One tap cycles 없음 → 보유 → 장보기 → 생략 → 없음 — used both on the
// recipe detail page and on a meal plan's per-recipe ingredient list, so a
// single tap always means the same thing everywhere ingredients show up.
// Purely controlled: the caller owns the state and decides when (or
// whether) a tap gets persisted — both callers now buffer taps behind their
// own "저장" button rather than writing on every tap, so a stray tap can't
// silently change fridge/shopping stock.
//
// Each state gets a visually distinct treatment (not just a border color)
// so 장보기/보유중/생략/미선택 stay legible even at a glance or without
// relying on color alone: 보유중 and 장보기 are solid fills (two different
// hues), 생략 is dashed + struck through, and 미선택 is a plain outline.
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
      ? "border border-dashed border-ink-faint bg-white text-ink-faint line-through decoration-1"
      : state === "fridge"
        ? "border border-transparent bg-accent text-white"
        : state === "shopping"
          ? "border border-transparent bg-positive text-white"
          : "border border-border bg-white text-ink-soft";

  return (
    <button
      type="button"
      onClick={() => onChange(nextIngredientState(state))}
      className={`inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[13px] font-semibold ${stateClass}`}
    >
      <StateIcon state={state} />
      {name}
      {amount && <span className="ml-1 font-normal opacity-70">{amount}</span>}
      {state === "skip" && <span className="ml-1 text-[10px] font-normal no-underline">{dict.recipes.skippedSuffix}</span>}
    </button>
  );
}
