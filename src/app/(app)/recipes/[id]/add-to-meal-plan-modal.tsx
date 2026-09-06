"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleRecipeInMealPlan, createMealPlanWithRecipe } from "@/lib/actions/meal-plans";
import { Modal } from "@/components/Modal";
import { useDict } from "@/lib/i18n/client";

type MealPlanOption = { id: string; title: string };

export function AddToMealPlanModal({
  open,
  onClose,
  recipeId,
  mealPlans,
  memberMealPlanIds,
}: {
  open: boolean;
  onClose: () => void;
  recipeId: string;
  mealPlans: MealPlanOption[];
  memberMealPlanIds: string[];
}) {
  const dict = useDict();
  const [selected, setSelected] = useState<Set<string>>(() => new Set(memberMealPlanIds));
  const [newTitle, setNewTitle] = useState("");
  const [pending, startTransition] = useTransition();
  const [creating, startCreating] = useTransition();
  const router = useRouter();

  function toggle(mealPlanId: string) {
    const next = !selected.has(mealPlanId);
    setSelected((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(mealPlanId);
      else copy.delete(mealPlanId);
      return copy;
    });
    startTransition(async () => {
      await toggleRecipeInMealPlan(mealPlanId, recipeId, next);
      router.refresh();
    });
  }

  function createAndAdd() {
    const title = newTitle.trim();
    if (!title) return;
    startCreating(async () => {
      const result = await createMealPlanWithRecipe(title, recipeId);
      if ("ok" in result) {
        setSelected((prev) => new Set(prev).add(result.id));
        setNewTitle("");
        router.refresh();
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} variant="sheet">
      <div className="mx-auto w-full max-w-[420px] rounded-t-3xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)]">
        <p className="mb-3 text-[15px] font-bold">{dict.mealPlan.addToMealPlanTitle}</p>

        {mealPlans.length === 0 ? (
          <p className="mb-3 text-xs text-ink-faint">{dict.mealPlan.noMealPlansYet}</p>
        ) : (
          <div className="mb-3 flex max-h-[280px] flex-col gap-1.5 overflow-y-auto">
            {mealPlans.map((plan) => {
              const active = selected.has(plan.id);
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => toggle(plan.id)}
                  disabled={pending}
                  className={`flex items-center justify-between rounded-xl border px-3.5 py-3 text-left text-sm font-semibold disabled:opacity-60 ${
                    active ? "border-accent bg-accent/8 text-accent-ink" : "border-transparent bg-surface text-ink"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{plan.title}</span>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      active ? "border-accent bg-accent" : "border-border bg-white"
                    }`}
                  >
                    {active && (
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12l5 5L20 6" />
                      </svg>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2 rounded-xl bg-surface py-1.5 pl-3.5 pr-1.5">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                createAndAdd();
              }
            }}
            placeholder={dict.mealPlan.newMealPlanInputPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
          />
          <button
            type="button"
            onClick={createAndAdd}
            disabled={creating || !newTitle.trim()}
            className="shrink-0 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {creating ? dict.mealPlan.creatingEllipsis : dict.common.confirm}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-surface py-3 text-sm font-bold text-ink-soft"
        >
          {dict.common.close}
        </button>
      </div>
    </Modal>
  );
}
