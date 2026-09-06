"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setIngredientState } from "@/lib/actions/recipes";
import { Modal } from "@/components/Modal";
import { useDict } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n/dictionaries/ko";

type ChoiceState = "shopping" | "fridge" | "skip";

const STATES: ChoiceState[] = ["shopping", "fridge", "skip"];

function stateLabel(state: ChoiceState, dict: Dictionary): string {
  if (state === "shopping") return dict.welcome.stateShopping;
  if (state === "fridge") return dict.welcome.stateFridge;
  return dict.welcome.stateSkip;
}

const STATE_STYLES: Record<ChoiceState, string> = {
  shopping: "bg-accent text-white",
  fridge: "bg-positive text-white",
  skip: "bg-ink-soft text-white",
};

type Ingredient = { name: string; skipped: boolean; owned: boolean; onShoppingList: boolean };

function currentState(ing: Ingredient): ChoiceState | undefined {
  if (ing.skipped) return "skip";
  if (ing.owned) return "fridge";
  if (ing.onShoppingList) return "shopping";
  return undefined;
}

export function MissingIngredientsButton({
  recipeId,
  ingredients,
  variant = "button",
}: {
  recipeId: string;
  ingredients: Ingredient[];
  // "button" is the full-width primary CTA used when something's actually
  // missing; "link" is a small secondary trigger for when the recipe is
  // already makeable (or everything missing is already on the shopping
  // list) — the badge/message stays primary, this just stays reachable so
  // "재료 저장하기" isn't only available while something's missing.
  variant?: "button" | "link";
}) {
  const dict = useDict();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  // Optimistic display only — every tap below writes immediately via
  // setIngredientState, there's no separate confirm step to buffer for.
  const [overrides, setOverrides] = useState<Record<string, ChoiceState>>({});

  function apply(name: string, state: ChoiceState) {
    setOverrides((prev) => ({ ...prev, [name]: state }));
    startTransition(async () => {
      await setIngredientState(recipeId, name, state);
      router.refresh();
    });
  }

  function applyAllTo(state: ChoiceState) {
    const names = ingredients.map((i) => i.name);
    setOverrides((prev) => {
      const next = { ...prev };
      names.forEach((n) => {
        next[n] = state;
      });
      return next;
    });
    startTransition(async () => {
      await Promise.all(names.map((n) => setIngredientState(recipeId, n, state)));
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "button"
            ? "w-full rounded-xl bg-accent py-2.5 text-[13px] font-bold text-white"
            : "text-xs font-bold text-accent-ink underline underline-offset-2"
        }
      >
        {dict.recipes.editOwnedIngredients}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} variant="sheet">
        <div className="mx-auto flex max-h-[80vh] w-full max-w-[420px] flex-col rounded-t-3xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)]">
            <p className="mb-1 text-[15px] font-bold">{dict.welcome.missingIngredientsTitle}</p>
            <p className="mb-3 text-xs text-ink-soft">{dict.recipes.missingIngredientsDescDetailed}</p>

            {/* Bulk-set every ingredient at once, then fine-tune individual
                items below — without this, each of them needs its own tap
                even when the same choice applies to all (or almost all). */}
            <div className="mb-3 flex gap-1.5">
              {STATES.map((state) => (
                <button
                  key={state}
                  type="button"
                  onClick={() => applyAllTo(state)}
                  className="flex-1 rounded-lg border border-border bg-white py-2 text-[11px] font-bold text-ink-soft active:opacity-70"
                >
                  {dict.recipes.applyAllPrefix}
                  {stateLabel(state, dict)}
                </button>
              ))}
            </div>

            <div className="mt-1 flex flex-col gap-2 overflow-y-auto">
              {ingredients.map((m) => {
                const active = overrides[m.name] ?? currentState(m);
                return (
                  <div key={m.name} className="rounded-xl bg-surface px-3.5 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{m.name}</span>
                      <div className="grid shrink-0 grid-cols-3 gap-0.5 rounded-lg bg-white p-0.5">
                        {STATES.map((state) => (
                          <button
                            key={state}
                            type="button"
                            onClick={() => apply(m.name, state)}
                            className={`whitespace-nowrap rounded-md px-2 py-1.5 text-[11px] font-bold ${
                              active === state ? STATE_STYLES[state] : "text-ink-soft"
                            }`}
                          >
                            {stateLabel(state, dict)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-xl bg-surface py-3 text-sm font-bold text-ink-soft"
            >
              {dict.common.close}
            </button>
        </div>
      </Modal>
    </>
  );
}
