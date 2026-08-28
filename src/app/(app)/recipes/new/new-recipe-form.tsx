"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createRecipe } from "@/lib/actions/recipes";
import { GlassCard } from "@/components/ui";
import { EmojiPicker } from "@/components/EmojiPicker";
import { TagPicker } from "@/components/TagPicker";
import { PhotoPicker } from "@/components/PhotoPicker";
import { ReferenceLinkField } from "@/components/ReferenceLinkField";
import { FieldLabel } from "@/components/FieldLabel";
import { StickyFormBar } from "@/components/StickyFormBar";
import { Modal } from "@/components/Modal";
import { ClearableInput } from "@/components/ClearableInput";
import { useDict } from "@/lib/i18n/client";

export function NewRecipeForm({ existingTags }: { existingTags: string[] }) {
  const dict = useDict();
  const [state, formAction, pending] = useActionState(createRecipe, undefined);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [hideIngredients, setHideIngredients] = useState(false);
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);
  const ingredientsRef = useRef<HTMLTextAreaElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  function handleAiResult(result: { title: string | null; ingredients: string[]; instructions: string }) {
    if (titleRef.current && !titleRef.current.value.trim() && result.title) {
      titleRef.current.value = result.title;
      // ClearableInput's own clear-button visibility tracks the input's
      // change events, not just its value — without this it wouldn't know
      // the field just got filled in.
      titleRef.current.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (ingredientsRef.current && result.ingredients.length > 0) {
      ingredientsRef.current.value = result.ingredients.join("\n");
    }
    if (notesRef.current && result.instructions) {
      notesRef.current.value = result.instructions;
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[22px] font-bold">{dict.recipes.newRecipeHeading}</h1>
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
              onClick={() => router.push("/recipes")}
              className="rounded-lg bg-accent px-3.5 py-2 text-xs font-bold text-white"
            >
              {dict.recipes.leave}
            </button>
          </div>
        </div>
      </Modal>

      <form
        id="new-recipe-form"
        action={formAction}
        className="flex flex-col gap-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))]"
      >
        <div>
          <FieldLabel>{dict.welcome.dishName}</FieldLabel>
          <ClearableInput
            ref={titleRef}
            name="title"
            placeholder={dict.recipes.dishNameOptionalPlaceholder}
            className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-base font-bold outline-none focus:border-accent"
          />
        </div>

        <GlassCard className="bg-white p-4">
          <p className="mb-1 text-[13px] font-bold">{dict.welcome.referenceLink}</p>
          <p className="mb-1 text-xs text-ink-soft">{dict.recipes.referenceLinkHint}</p>
          <p className="mb-3 text-[11px] text-ink-faint">{dict.recipes.aiYoutubeOnlyHint}</p>
          <ReferenceLinkField name="referenceUrl" onAiResult={handleAiResult} />
        </GlassCard>

        <GlassCard className="bg-white p-4">
          <div className="mb-1 flex items-center justify-between gap-2">
            <FieldLabel>{dict.welcome.ingredients}</FieldLabel>
            <label className="mb-3 flex shrink-0 items-center gap-1.5 text-xs font-semibold text-ink-soft">
              <input
                type="checkbox"
                name="hideIngredients"
                checked={hideIngredients}
                onChange={(e) => setHideIngredients(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-accent"
              />
              {dict.recipes.hideIngredientsLabel}
            </label>
          </div>
          <div className={hideIngredients ? "hidden" : ""}>
            <p className="mb-3 text-xs text-ink-soft">{dict.welcome.ingredientsPlaceholder}</p>
            <textarea
              ref={ingredientsRef}
              name="ingredients"
              rows={12}
              placeholder={dict.recipes.ingredientsExamplePlaceholder}
              className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
            />
          </div>
        </GlassCard>

        <GlassCard className="bg-white p-4">
          <FieldLabel>{dict.welcome.instructions}</FieldLabel>
          <textarea
            ref={notesRef}
            name="notes"
            rows={8}
            placeholder={dict.recipes.notesPlaceholder}
            className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
        </GlassCard>

        <GlassCard className="bg-white p-4">
          <FieldLabel>{dict.recipes.photoOrEmojiLabel}</FieldLabel>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-soft">{dict.recipes.photoLabel}</span>
              <PhotoPicker name="photos" onCountChange={setPhotoCount} />
            </div>
            {photoCount === 0 && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-ink-soft">{dict.recipes.iconEmojiLabel}</span>
                <EmojiPicker name="iconEmoji" />
              </label>
            )}
          </div>
        </GlassCard>

        <GlassCard className="bg-white p-4">
          <p className="mb-3 text-[13px] font-bold">{dict.recipes.additionalInfo}</p>
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel>{dict.recipes.descriptionLabel}</FieldLabel>
              <ClearableInput
                name="subtitle"
                placeholder={dict.recipes.subtitlePlaceholder}
                className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <FieldLabel>{dict.recipes.tagsLabel}</FieldLabel>
              <TagPicker name="tags" existingTags={existingTags} />
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
              <input
                type="checkbox"
                name="isPublic"
                className="h-4 w-4 rounded border-border accent-accent"
              />
              {dict.recipes.publishToExploreLabel}
            </label>
          </div>
        </GlassCard>

        {state?.error && <p className="text-sm text-warn-ink">{state.error}</p>}
      </form>

      <StickyFormBar
        formId="new-recipe-form"
        pending={pending}
        label={dict.recipes.saveNewButton}
        pendingLabel={dict.recipes.saving}
      />
    </div>
  );
}
