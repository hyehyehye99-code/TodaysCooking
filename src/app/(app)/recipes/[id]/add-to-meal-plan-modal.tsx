"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleRecipeInMealPlan } from "@/lib/actions/meal-plans";
import { Modal } from "@/components/Modal";
import { SavedToast } from "@/components/SavedToast";
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
  const [saving, startSaving] = useTransition();
  const [savedTrigger, setSavedTrigger] = useState(0);
  const router = useRouter();

  // Buffered like the ingredient chips — taps only update local selection,
  // so nothing actually moves until 저장하기. Re-syncing whenever `open`
  // flips true (during render, not an effect — the React-endorsed way to
  // reset state on a prop change) means closing without saving never leaves
  // a stale local selection around for next time it opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSelected(new Set(memberMealPlanIds));
  }

  function toggle(mealPlanId: string) {
    setSelected((prev) => {
      const copy = new Set(prev);
      if (copy.has(mealPlanId)) copy.delete(mealPlanId);
      else copy.add(mealPlanId);
      return copy;
    });
  }

  function save() {
    const original = new Set(memberMealPlanIds);
    const added = [...selected].filter((id) => !original.has(id));
    const removed = [...original].filter((id) => !selected.has(id));

    if (added.length === 0 && removed.length === 0) {
      onClose();
      return;
    }

    startSaving(async () => {
      await Promise.all([
        ...added.map((id) => toggleRecipeInMealPlan(id, recipeId, true)),
        ...removed.map((id) => toggleRecipeInMealPlan(id, recipeId, false)),
      ]);
      setSavedTrigger((t) => t + 1);
      router.refresh();
      onClose();
    });
  }

  return (
    <>
      {/* Rendered outside <Modal> so its fade-out toast survives the
          modal's own close transition instead of unmounting with it. */}
      <SavedToast message={dict.common.savedMessage} trigger={savedTrigger} />

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
                    className={`flex items-center justify-between rounded-xl border px-3.5 py-3 text-left text-sm font-semibold ${
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

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? dict.recipes.saving : dict.recipes.saveButton}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full rounded-xl bg-surface py-3 text-sm font-bold text-ink-soft"
          >
            {dict.common.close}
          </button>
        </div>
      </Modal>
    </>
  );
}
