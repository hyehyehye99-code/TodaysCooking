"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMealPlan, deleteMealPlan } from "@/lib/actions/meal-plans";
import { GlassCard } from "@/components/ui";
import { RecipePicker } from "@/components/RecipePicker";
import { FieldLabel } from "@/components/FieldLabel";
import { StickyFormBar } from "@/components/StickyFormBar";
import { Modal } from "@/components/Modal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ClearableInput } from "@/components/ClearableInput";
import { EmojiPicker } from "@/components/EmojiPicker";
import { useDict } from "@/lib/i18n/client";

type PickableRecipe = { id: string; title: string | null; cover_photo_urls: string[]; icon_emoji: string | null };

// <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in the viewer's own
// local time — computed client-side (via the Date object's local getters,
// not the UTC ones) so it's correct for whatever timezone the browser is
// actually in, not the server's.
function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditMealPlanForm({
  mealPlanId,
  title,
  iconEmoji,
  eventDateIso,
  headcount,
  recipes,
  defaultSelected,
}: {
  mealPlanId: string;
  title: string;
  iconEmoji: string | null;
  eventDateIso: string | null;
  headcount: number | null;
  recipes: PickableRecipe[];
  defaultSelected: string[];
}) {
  const dict = useDict();
  const [state, formAction, pending] = useActionState(updateMealPlan, undefined);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();
  const router = useRouter();

  function doDelete() {
    startDeleteTransition(async () => {
      await deleteMealPlan(mealPlanId);
    });
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[22px] font-bold">{dict.mealPlan.editHeading}</h1>
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
          <p className="text-sm font-bold text-ink">{dict.recipes.unsavedEditTitle}</p>
          <p className="mt-2 text-xs text-ink-soft">{dict.recipes.unsavedEditDesc}</p>
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
              onClick={() => router.push(`/explore/${mealPlanId}`)}
              className="rounded-lg bg-accent px-3.5 py-2 text-xs font-bold text-white"
            >
              {dict.recipes.leave}
            </button>
          </div>
        </div>
      </Modal>

      <form
        id="edit-meal-plan-form"
        action={formAction}
        className="flex flex-col gap-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))]"
      >
        <input type="hidden" name="id" value={mealPlanId} />

        <div>
          <FieldLabel>{dict.mealPlan.titleLabel}</FieldLabel>
          <ClearableInput
            name="title"
            defaultValue={title}
            placeholder={dict.mealPlan.titlePlaceholder}
            className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-base font-bold outline-none focus:border-accent"
          />
        </div>

        <div>
          <FieldLabel>{dict.mealPlan.iconLabel}</FieldLabel>
          <EmojiPicker name="iconEmoji" defaultValue={iconEmoji} />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <FieldLabel>{dict.mealPlan.eventDateLabel}</FieldLabel>
            <input
              type="datetime-local"
              name="eventDate"
              defaultValue={toDatetimeLocalValue(eventDateIso)}
              className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="w-24">
            <FieldLabel>{dict.mealPlan.headcountLabel}</FieldLabel>
            <input
              type="number"
              min={1}
              name="headcount"
              defaultValue={headcount ?? ""}
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
            <RecipePicker
              name="recipeIds"
              recipes={recipes}
              defaultSelected={defaultSelected}
              untitledLabel={dict.recipes.untitledLink}
            />
          )}
        </GlassCard>

        {state?.error && <p className="text-sm text-warn-ink">{state.error}</p>}

        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className="mt-2 w-full rounded-xl border border-transparent py-2.5 text-xs font-bold text-warn-ink"
        >
          {dict.mealPlan.deleteMealPlanButton}
        </button>
      </form>

      <ConfirmModal
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title={dict.mealPlan.deleteTitle}
        description={dict.mealPlan.deleteDescription}
        confirmSlot={
          <button
            type="button"
            onClick={doDelete}
            disabled={deletePending}
            className="rounded-lg bg-warn px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {deletePending ? dict.recipes.deleting : dict.common.delete}
          </button>
        }
      />

      <StickyFormBar
        formId="edit-meal-plan-form"
        pending={pending}
        label={dict.recipes.saveButton}
        pendingLabel={dict.recipes.saving}
      />
    </div>
  );
}
