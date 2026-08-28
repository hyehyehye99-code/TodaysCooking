"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { updateRecipe } from "@/lib/actions/recipes";
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
import type { RecipeWithIngredients } from "@/lib/types";

export function EditRecipeForm({
  recipe,
  referenceUrl,
  referencePreview,
  existingTags,
}: {
  recipe: RecipeWithIngredients;
  referenceUrl: string;
  referencePreview: { title: string | null; thumbnailUrl: string | null; domain: string | null } | null;
  existingTags: string[];
}) {
  const dict = useDict();
  const [state, formAction, pending] = useActionState(updateRecipe, undefined);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [photoCount, setPhotoCount] = useState(recipe.cover_photo_urls.length);
  const router = useRouter();
  const ingredientsText = recipe.recipe_ingredients
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((i) => (i.amount ? `${i.name} ${i.amount}` : i.name))
    .join("\n");

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[22px] font-bold">{dict.recipes.editRecipeHeading}</h1>
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
              onClick={() => router.push(`/recipes/${recipe.id}`)}
              className="rounded-lg bg-accent px-3.5 py-2 text-xs font-bold text-white"
            >
              {dict.recipes.leave}
            </button>
          </div>
        </div>
      </Modal>

      <form
        id="edit-recipe-form"
        action={formAction}
        className="flex flex-col gap-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))]"
      >
        <input type="hidden" name="id" value={recipe.id} />

        <div>
          <FieldLabel>{dict.welcome.dishName}</FieldLabel>
          <ClearableInput
            name="title"
            defaultValue={recipe.title ?? ""}
            placeholder={dict.recipes.dishNameOptionalPlaceholder}
            className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-base font-bold outline-none focus:border-accent"
          />
        </div>

        <GlassCard className="bg-white p-4">
          <p className="mb-1 text-[13px] font-bold">{dict.welcome.referenceLink}</p>
          <p className="mb-3 text-xs text-ink-soft">{dict.recipes.referenceLinkHint}</p>
          <ReferenceLinkField name="referenceUrl" defaultValue={referenceUrl} initialPreview={referencePreview} />
        </GlassCard>

        <GlassCard className="bg-white p-4">
          <FieldLabel>{dict.welcome.ingredients}</FieldLabel>
          <p className="mb-3 text-xs text-ink-soft">{dict.welcome.ingredientsPlaceholder}</p>
          <textarea
            name="ingredients"
            rows={12}
            defaultValue={ingredientsText}
            className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
        </GlassCard>

        <GlassCard className="bg-white p-4">
          <FieldLabel>{dict.welcome.instructions}</FieldLabel>
          <textarea
            name="notes"
            rows={8}
            defaultValue={recipe.notes ?? ""}
            placeholder={dict.recipes.notesPlaceholder}
            className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
        </GlassCard>

        <GlassCard className="bg-white p-4">
          <FieldLabel>{dict.recipes.photoOrEmojiLabel}</FieldLabel>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-soft">{dict.recipes.photoLabel}</span>
              <PhotoPicker
                name="photos"
                existingUrls={recipe.cover_photo_urls}
                onCountChange={setPhotoCount}
              />
            </div>
            {photoCount === 0 && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-ink-soft">{dict.recipes.iconEmojiLabel}</span>
                <EmojiPicker name="iconEmoji" defaultValue={recipe.icon_emoji} />
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
                defaultValue={recipe.subtitle ?? ""}
                placeholder={dict.recipes.subtitlePlaceholder}
                className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <FieldLabel>{dict.recipes.tagsLabel}</FieldLabel>
              <TagPicker name="tags" existingTags={existingTags} defaultSelected={recipe.tags} />
            </div>
          </div>
        </GlassCard>

        {state?.error && <p className="text-sm text-warn-ink">{state.error}</p>}
      </form>

      <StickyFormBar
        formId="edit-recipe-form"
        pending={pending}
        label={dict.recipes.saveButton}
        pendingLabel={dict.recipes.saving}
      />
    </div>
  );
}
