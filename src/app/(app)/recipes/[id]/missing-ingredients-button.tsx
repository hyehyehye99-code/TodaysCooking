"use client";

import { useState, useTransition } from "react";
import { resolveMissingIngredients } from "@/lib/actions/recipes";

export function MissingIngredientsButton({
  recipeId,
  missing,
}: {
  recipeId: string;
  missing: string[];
}) {
  const [open, setOpen] = useState(false);
  const [choices, setChoices] = useState<Record<string, "shopping" | "fridge">>({});
  const [pending, startTransition] = useTransition();

  function openModal() {
    setChoices(Object.fromEntries(missing.map((name) => [name, "shopping" as const])));
    setOpen(true);
  }

  function handleConfirm() {
    const shopping = missing.filter((name) => choices[name] !== "fridge");
    const fridge = missing.filter((name) => choices[name] === "fridge");
    startTransition(async () => {
      await resolveMissingIngredients({ recipeId, shopping, fridge });
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

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative flex max-h-[80vh] w-full max-w-[420px] flex-col rounded-t-3xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)]">
            <p className="mb-1 text-[15px] font-bold">부족한 재료 확인</p>
            <p className="mb-4 text-xs text-ink-soft">
              이미 있는 재료는 냉장고로 표시하고, 나머지만 장보기에 담을게요.
            </p>

            <div className="flex flex-col gap-2 overflow-y-auto">
              {missing.map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3.5 py-2.5"
                >
                  <span className="text-sm font-semibold">{name}</span>
                  <div className="flex shrink-0 rounded-lg bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => setChoices((c) => ({ ...c, [name]: "shopping" }))}
                      className={`rounded-md px-2.5 py-1.5 text-[11px] font-bold ${
                        choices[name] !== "fridge" ? "bg-accent text-white" : "text-ink-soft"
                      }`}
                    >
                      장보기
                    </button>
                    <button
                      type="button"
                      onClick={() => setChoices((c) => ({ ...c, [name]: "fridge" }))}
                      className={`rounded-md px-2.5 py-1.5 text-[11px] font-bold ${
                        choices[name] === "fridge" ? "bg-positive text-white" : "text-ink-soft"
                      }`}
                    >
                      냉장고에 있어요
                    </button>
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
        </div>
      )}
    </>
  );
}
