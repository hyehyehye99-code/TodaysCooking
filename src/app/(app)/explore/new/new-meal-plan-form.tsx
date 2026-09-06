"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createMealPlan } from "@/lib/actions/meal-plans";
import { GlassCard } from "@/components/ui";
import { RecipePicker } from "@/components/RecipePicker";
import { FieldLabel } from "@/components/FieldLabel";
import { StickyFormBar } from "@/components/StickyFormBar";
import { Modal } from "@/components/Modal";
import { ClearableInput } from "@/components/ClearableInput";
import { useDict } from "@/lib/i18n/client";

type PickableRecipe = { id: string; title: string | null; cover_photo_urls: string[]; icon_emoji: string | null };

export function NewMealPlanForm({ recipes }: { recipes: PickableRecipe[] }) {
  const dict = useDict();
  const [state, formAction, pending] = useActionState(createMealPlan, undefined);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const router = useRouter();

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[22px] font-bold">{dict.mealPlan.newHeading}</h1>
        <button
          type="button"
          onClick={() => setConfirmingClose(true)}
          aria-label={dict.common.close}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>

      <Modal open={confirmingClose} onClose={() => setConfirmingClose(false)} variant="center">
        <div className="mx-auto w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-xl">
          <p className="text-sm font-bold text-ink">{dict.recipes.unsavedNewTitle}</p>
          <p className="mt-2 text-xs text-ink-soft">{dict.recipes.unsavedNewDesc}</p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmingClose(false)}
              className="rounded-lg bg-surface px-3.5 py-2 text-xs font-bold text-ink-soft"
            >
              {dict.recipes.keepEditing}
            </button>
            <button
              type="button"
              onClick={() => router.push("/explore")}
              className="rounded-lg bg-accent px-3.5 py-2 text-xs font-bold text-white"
            >
              {dict.recipes.leave}
            </button>
          </div>
        </div>
      </Modal>

      <form
        id="new-meal-plan-form"
        action={formAction}
        className="flex flex-col gap-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))]"
      >
        <div>
          <FieldLabel>{dict.mealPlan.titleLabel}</FieldLabel>
          <ClearableInput
            name="title"
            placeholder={dict.mealPlan.titlePlaceholder}
            className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-base font-bold outline-none focus:border-accent"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <FieldLabel>{dict.mealPlan.eventDateLabel}</FieldLabel>
            <input
              type="datetime-local"
              name="eventDate"
              className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="w-24">
            <FieldLabel>{dict.mealPlan.headcountLabel}</FieldLabel>
            <input
              type="number"
              min={1}
              name="headcount"
              placeholder="-"
              className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
            />
          </div>
        </div>

        <GlassCard className="bg-white p-4">
          <FieldLabel>{dict.mealPlan.pickRecipesLabel}</FieldLabel>
          {recipes.length === 0 ? (
            <p className="text-xs text-ink-faint">{dict.mealPlan.noRecipesYet}</p>
          ) : (
            <RecipePicker name="recipeIds" recipes={recipes} untitledLabel={dict.recipes.untitledLink} />
          )}
        </GlassCard>

        {state?.error && <p className="text-sm text-warn-ink">{state.error}</p>}
      </form>

      <StickyFormBar
        formId="new-meal-plan-form"
        pending={pending}
        label={dict.mealPlan.saveButton}
        pendingLabel={dict.recipes.saving}
      />
    </div>
  );
}
