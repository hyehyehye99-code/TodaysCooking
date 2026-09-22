"use client";

// Guest-mode versions of the recipes screens: same components as the signed-in
// pages, fed from this device's localStorage (lib/guest/store.ts) instead of
// Supabase.

import { IconGlyph } from "@/components/IconGlyph";
import { useMemo, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui";
import { DefaultMascot } from "@/components/Mascot";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useDict } from "@/lib/i18n/client";
import { deleteRecipes, sortRecipes, toRecipeWithIngredients, useGuestData } from "@/lib/guest/store";
import { RecipeList } from "./recipe-list";
import { NewRecipeForm } from "./new/new-recipe-form";
import { EditRecipeForm } from "./[id]/edit/edit-recipe-form";
import { FavoriteButton } from "./[id]/favorite-button";
import { CookingToggleButton } from "./[id]/cooking-toggle-button";
import { IngredientsSection } from "./[id]/ingredients-section";
import { RecipePhotoGallery } from "./[id]/recipe-photo-gallery";

function useAllTags() {
  const { data, ready } = useGuestData();
  const tags = useMemo(() => [...new Set(data.recipes.flatMap((r) => r.tags))].sort(), [data.recipes]);
  return { tags, ready };
}

export function GuestRecipeList() {
  const dict = useDict();
  const { data, ready } = useGuestData();
  const recipes = useMemo(() => sortRecipes(data.recipes).map(toRecipeWithIngredients), [data.recipes]);
  const owned = useMemo(() => data.fridge.filter((f) => f.in_stock).map((f) => f.name), [data.fridge]);

  if (!ready) return null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-surface px-3.5 py-2.5">
        <p className="text-[11px] leading-snug text-ink-soft">{dict.guest.localNotice}</p>
        <Link href="/login" className="shrink-0 text-xs font-bold text-accent">
          {dict.guest.loginButton}
        </Link>
      </div>
      <RecipeList recipes={recipes} ownedIngredients={owned} guest />
    </div>
  );
}

export function GuestNewRecipe() {
  const { tags, ready } = useAllTags();
  if (!ready) return null;
  return <NewRecipeForm existingTags={tags} guest />;
}

export function GuestEditRecipe({ id }: { id: string }) {
  const { data, ready } = useGuestData();
  const { tags } = useAllTags();
  if (!ready) return null;

  const recipe = data.recipes.find((r) => r.id === id);
  if (!recipe) notFound();

  return (
    <EditRecipeForm
      recipe={toRecipeWithIngredients(recipe)}
      referenceUrl={recipe.reference?.url ?? ""}
      referencePreview={
        recipe.reference
          ? {
              title: recipe.reference.title,
              thumbnailUrl: recipe.reference.thumbnail_url,
              domain: recipe.reference.domain,
            }
          : null
      }
      existingTags={tags}
      guest
    />
  );
}

function GuestRecipeMenu({ recipeId, onDelete }: { recipeId: string; onDelete: () => void }) {
  const dict = useDict();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={dict.recipes.moreOptions}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-ink"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <circle cx="12" cy="5" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="12" cy="19" r="1.8" />
          </svg>
        </button>

        {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}

        <div
          className={`absolute right-0 top-full z-20 mt-2 w-40 origin-top-right overflow-hidden rounded-2xl border border-border bg-white shadow-lg transition-all duration-200 ${
            open
              ? "max-h-52 translate-y-0 opacity-100"
              : "pointer-events-none max-h-0 -translate-y-2 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-0.5 p-1.5">
            <Link
              href={`/recipes/${recipeId}/edit`}
              onClick={() => setOpen(false)}
              className="w-full whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink"
            >
              {dict.recipes.editButton}
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirming(true);
              }}
              className="w-full whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-warn-ink"
            >
              {dict.recipes.deleteMenu}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={dict.recipes.deleteRecipeTitle}
        description={dict.recipes.deleteRecipeDescription}
        confirmSlot={
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg bg-warn px-3.5 py-2 text-xs font-bold text-white"
          >
            {dict.common.delete}
          </button>
        }
      />
    </>
  );
}

export function GuestRecipeDetail({ id, closeHref }: { id: string; closeHref: string }) {
  const dict = useDict();
  const router = useRouter();
  const { data, ready } = useGuestData();
  // Set the moment a delete is confirmed: the store update removes the recipe
  // before the navigation away lands, which would otherwise flash "not found".
  const [deleted, setDeleted] = useState(false);

  if (!ready || deleted) return null;

  const guestRecipe = data.recipes.find((r) => r.id === id);
  if (!guestRecipe) notFound();

  const r = toRecipeWithIngredients(guestRecipe);
  const referenceBookmark = guestRecipe.reference;

  const owned = new Set(data.fridge.filter((f) => f.in_stock).map((f) => f.name));
  const onShoppingList = new Set(data.shopping.map((s) => s.name));

  const displayTitle =
    r.title || referenceBookmark?.title || referenceBookmark?.domain || dict.recipes.untitledLink;

  const ingredients = r.recipe_ingredients;
  const activeIngredients = ingredients.filter((ing) => !ing.skipped);
  const missing = activeIngredients.filter((ing) => !owned.has(ing.name));
  const makeable = missing.length === 0;
  const allAdded = missing.length > 0 && missing.every((m) => onShoppingList.has(m.name));

  function handleDelete() {
    setDeleted(true);
    router.replace("/recipes");
    deleteRecipes([id]);
  }

  return (
    <div className="animate-fade-in-up pt-2">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className={`flex min-w-0 flex-1 gap-3 ${r.subtitle ? "items-start" : "items-center"}`}>
          {r.cover_photo_urls.length === 0 && r.icon_emoji && (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface text-2xl">
              <IconGlyph value={r.icon_emoji} box={56} />
            </div>
          )}
          {r.cover_photo_urls.length === 0 && !r.icon_emoji && (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface">
              <DefaultMascot pool="recipe" seed={r.id} box={56} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-bold">{displayTitle}</h1>
            {r.subtitle && <p className="mt-0.5 text-sm text-ink-soft">{r.subtitle}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <FavoriteButton recipeId={r.id} isFavorite={r.is_favorite} guest />
          <GuestRecipeMenu recipeId={r.id} onDelete={handleDelete} />
          <Link
            href={closeHref}
            aria-label={dict.common.close}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-ink"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </Link>
        </div>
      </div>

      <RecipePhotoGallery photos={r.cover_photo_urls} />

      {r.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {r.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-positive-ink">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {referenceBookmark && (
        <a href={referenceBookmark.url} target="_blank" rel="noopener noreferrer" className="mt-3 block">
          <GlassCard className="flex gap-3 bg-white p-2.5">
            <div className="h-[72px] w-[88px] shrink-0 overflow-hidden rounded-xl bg-black/[0.04]">
              {referenceBookmark.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={referenceBookmark.thumbnail_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--color-ink-faint)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 3.5h12a.5.5 0 0 1 .5.5v17l-6.5-4-6.5 4v-17a.5.5 0 0 1 .5-.5z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
              <p className="line-clamp-2 text-[13px] font-bold leading-snug">
                {referenceBookmark.title || dict.welcome.referenceLink}
              </p>
              <span className="text-[11px] text-ink-faint">{referenceBookmark.domain}</span>
            </div>
          </GlassCard>
        </a>
      )}

      {!r.hide_ingredients && ingredients.length > 0 && (
        <IngredientsSection
          recipeId={r.id}
          ownedCount={activeIngredients.length - missing.length}
          totalCount={activeIngredients.length}
          guest
          ingredients={ingredients.map((ing) => ({
            id: ing.id,
            name: ing.name,
            amount: ing.amount,
            initialState: ing.skipped ? "skip" : owned.has(ing.name) ? "fridge" : onShoppingList.has(ing.name) ? "shopping" : "none",
          }))}
        />
      )}

      {!r.hide_ingredients && activeIngredients.length > 0 && (makeable || allAdded) && (
        <div className="mt-4">
          {makeable ? (
            <div className="flex items-center gap-2 rounded-xl border border-transparent bg-positive/10 px-3 py-2.5">
              <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="var(--color-positive-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 7.5l3 3 6-7" />
              </svg>
              <span className="text-[13px] font-bold text-positive-ink">{dict.recipes.makeableBadge}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-transparent bg-surface px-3 py-2.5">
              <span className="text-[13px] font-bold text-ink-faint">{dict.welcome.addedToShoppingList}</span>
            </div>
          )}
        </div>
      )}

      {r.notes && (
        <div className="mt-6">
          <p className="mb-2 text-[15px] font-bold">{dict.welcome.instructions}</p>
          <GlassCard className="bg-surface p-4">
            <p className="whitespace-pre-line text-sm text-ink">{r.notes}</p>
          </GlassCard>
        </div>
      )}

      <div className="mt-6">
        <CookingToggleButton recipeId={r.id} isCooking={r.is_cooking} guest />
      </div>
    </div>
  );
}
