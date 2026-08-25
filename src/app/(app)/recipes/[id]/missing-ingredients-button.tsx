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
  missing,
}: {
  recipeId: string;
  missing: { name: string; skipped: boolean }[];
}) {
  const dict = useDict();
  const [open, setOpen] = useState(false);
  const [choices, setChoices] = useState<Record<string, ChoiceState | undefined>>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function openModal() {
    setChoices(
      Object.fromEntries(
        missing.filter((m) => m.skipped).map((m) => [m.name, "skip" as ChoiceState])
      )
    );
    setOpen(true);
  }

  function handleConfirm() {
    const shopping = missing.filter((m) => choices[m.name] === "shopping").map((m) => m.name);
    const fridge = missing.filter((m) => choices[m.name] === "fridge").map((m) => m.name);
    const skip = missing.filter((m) => choices[m.name] === "skip").map((m) => m.name);
    startTransition(async () => {
      await resolveMissingIngredients({ recipeId, shopping, fridge, skip });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="w-full rounded-xl bg-accent py-2.5 text-[13px] font-bold text-white"
      >
        {dict.welcome.addToShoppingList}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} variant="sheet">
        <div className="mx-auto flex max-h-[80vh] w-full max-w-[420px] flex-col rounded-t-3xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)]">
            <p className="mb-1 text-[15px] font-bold">{dict.welcome.missingIngredientsTitle}</p>
            <p className="mb-3 text-xs text-ink-soft">{dict.recipes.missingIngredientsDescDetailed}</p>

            <div className="mt-1 flex flex-col gap-2 overflow-y-auto">
              {missing.map((m) => (
                <div key={m.name} className="rounded-xl bg-surface px-3.5 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{m.name}</span>
                    <div className="grid shrink-0 grid-cols-3 gap-0.5 rounded-lg bg-white p-0.5">
                      {STATES.map((state) => (
                        <button
                          key={state}
                          type="button"
                          onClick={() => setChoices((c) => ({ ...c, [m.name]: state }))}
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
