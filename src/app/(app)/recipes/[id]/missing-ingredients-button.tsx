"use client";

import { useState, useTransition } from "react";
import { resolveMissingIngredients } from "@/lib/actions/recipes";
import { Modal } from "@/components/Modal";

type ChoiceState = "shopping" | "fridge" | "skip";

const STATES: ChoiceState[] = ["shopping", "fridge", "skip"];

const STATE_LABELS: Record<ChoiceState, string> = {
  shopping: "구매 필요",
  fridge: "보유 중",
  skip: "생략",
};

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
  const [open, setOpen] = useState(false);
  const [choices, setChoices] = useState<Record<string, ChoiceState>>({});
  const [pending, startTransition] = useTransition();

  function openModal() {
    setChoices(
      Object.fromEntries(missing.map((m) => [m.name, m.skipped ? "skip" : "shopping"]))
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
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="w-full rounded-xl bg-accent py-2.5 text-[13px] font-bold text-white"
      >
        부족한 재료 장보기 담기
      </button>

      <Modal open={open} onClose={() => setOpen(false)} variant="sheet">
        <div className="mx-auto flex max-h-[80vh] w-full max-w-[420px] flex-col rounded-t-3xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)]">
            <p className="mb-1 text-[15px] font-bold">부족한 재료 확인</p>
            <p className="mb-3 text-xs text-ink-soft">
              이미 있는 재료는 냉장고로, 필요 없는 재료는 생략으로 표시하고, 나머지만 장보기에
              담을게요.
            </p>

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
                          {STATE_LABELS[state]}
                        </button>
                      ))}
                    </div>
                  </div>
                  {choices[m.name] === "fridge" && (
                    <p className="mt-1.5 text-[11px] text-positive-ink">냉장고에도 추가돼요</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl bg-surface py-3 text-sm font-bold text-ink-soft"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className="flex-1 rounded-xl bg-accent py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {pending ? "담는 중..." : "담기"}
              </button>
            </div>
        </div>
      </Modal>
    </>
  );
}
