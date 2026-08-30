"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveMissingIngredients } from "@/lib/actions/recipes";
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

export function MissingIngredientsButton({
  recipeId,
  ingredients,
  variant = "button",
}: {
  recipeId: string;
  ingredients: { name: string; skipped: boolean; owned: boolean }[];
  // "button" is the full-width primary CTA used when something's actually
  // missing; "link" is a small secondary trigger for when the recipe is
  // already makeable (or everything missing is already on the shopping
  // list) — the badge/message stays primary, this just stays reachable so
  // "보유 재료 수정" isn't only available while something's missing.
  variant?: "button" | "link";
}) {
  const dict = useDict();
  const [open, setOpen] = useState(false);
  const [choices, setChoices] = useState<Record<string, ChoiceState | undefined>>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function setAllTo(state: ChoiceState) {
    setChoices(Object.fromEntries(ingredients.map((i) => [i.name, state])));
  }

  function openModal() {
    // Seed each ingredient's control to reflect where it already stands —
    // skipped stays skipped, an owned ingredient starts on "fridge" (so
    // confirming without touching anything is a no-op), everything else
    // starts unselected (genuinely missing, untouched).
    setChoices(
      Object.fromEntries(
        ingredients
          .map((i): [string, ChoiceState] | null => {
            if (i.skipped) return [i.name, "skip"];
            if (i.owned) return [i.name, "fridge"];
            return null;
          })
          .filter((entry): entry is [string, ChoiceState] => entry !== null)
      )
    );
    setOpen(true);
  }

  function handleConfirm() {
    const shopping = ingredients.filter((i) => choices[i.name] === "shopping").map((i) => i.name);
    const fridge = ingredients.filter((i) => choices[i.name] === "fridge").map((i) => i.name);
    const skip = ingredients.filter((i) => choices[i.name] === "skip").map((i) => i.name);
    // Anything that started owned but didn't end up back on "fridge" —
    // deselected, switched to shopping/skip, whatever — needs to actually
    // come out of the fridge, not just sit unrepresented in the payload.
    const unown = ingredients.filter((i) => i.owned && choices[i.name] !== "fridge").map((i) => i.name);
    startTransition(async () => {
      await resolveMissingIngredients({ recipeId, shopping, fridge, skip, unown });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
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
                  onClick={() => setAllTo(state)}
                  className="flex-1 rounded-lg border border-border bg-white py-2 text-[11px] font-bold text-ink-soft active:opacity-70"
                >
                  {dict.recipes.applyAllPrefix}
                  {stateLabel(state, dict)}
                </button>
              ))}
            </div>

            <div className="mt-1 flex flex-col gap-2 overflow-y-auto">
              {ingredients.map((m) => (
                <div key={m.name} className="rounded-xl bg-surface px-3.5 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{m.name}</span>
                    <div className="grid shrink-0 grid-cols-3 gap-0.5 rounded-lg bg-white p-0.5">
                      {STATES.map((state) => (
                        <button
                          key={state}
                          type="button"
                          onClick={() =>
                            setChoices((c) => ({ ...c, [m.name]: c[m.name] === state ? undefined : state }))
                          }
                          className={`whitespace-nowrap rounded-md px-2 py-1.5 text-[11px] font-bold ${
                            choices[m.name] === state ? STATE_STYLES[state] : "text-ink-soft"
                          }`}
                        >
                          {stateLabel(state, dict)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl bg-surface py-3 text-sm font-bold text-ink-soft"
              >
                {dict.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className="flex-1 rounded-xl bg-accent py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {pending ? dict.recipes.addingEllipsis : dict.welcome.modalConfirm}
              </button>
            </div>
        </div>
      </Modal>
    </>
  );
}
