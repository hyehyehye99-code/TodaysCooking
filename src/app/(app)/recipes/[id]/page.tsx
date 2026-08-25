import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { GlassCard } from "@/components/ui";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { chefName } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/server";
import type { RecipeWithIngredients } from "@/lib/types";
import { DeleteRecipeButton } from "./delete-recipe-button";
import { MissingIngredientsButton } from "./missing-ingredients-button";
import { RecipePhotoGallery } from "./recipe-photo-gallery";
import { ReactionLog } from "./reaction-log";
import { ShareRecipeButton } from "./share-recipe-button";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();
  const { dict } = await getDictionary();

  // None of these four need each other's result, so they all go out in one
  // round trip instead of fetching the recipe first and waiting on it before
  // starting the rest. Only creatorProfile (below) genuinely depends on the
  // recipe row, since it needs r.created_by.
  const [{ data: recipe }, { data: fridgeItems }, { data: shoppingItems }, { data: referenceBookmark }, { data: reactions }] =
    await Promise.all([
      supabase.from("recipes").select("*, recipe_ingredients(*)").eq("id", id).single(),
      supabase.from("fridge_items").select("name, in_stock").eq("household_id", household!.id),
      supabase.from("shopping_items").select("name").eq("household_id", household!.id),
      supabase
        .from("bookmarks")
        .select("url, domain, title, thumbnail_url")
        .eq("recipe_id", id)
        .maybeSingle(),
      supabase.rpc("get_recipe_reactions", { target_recipe_id: id }),
    ]);

  if (!recipe) notFound();

  const r = recipe as RecipeWithIngredients;

  const { data: creatorProfile } = await supabase
    .from("profiles")
    .select("nickname, icon_emoji")
    .eq("id", r.created_by)
    .maybeSingle();

  const owned = new Set((fridgeItems ?? []).filter((i) => i.in_stock).map((i) => i.name));
  const onShoppingList = new Set((shoppingItems ?? []).map((i) => i.name));

  const ingredients = r.recipe_ingredients;
  // 생략(skipped) ingredients are excluded from the "보유 중" ratio and the
  // makeable check entirely, but still surface in the resolve-missing modal
  // (as long as something else is still unresolved) so a skip can be undone.
  const activeIngredients = ingredients.filter((ing) => !ing.skipped);
  const missing = activeIngredients.filter((ing) => !owned.has(ing.name));
  const makeable = missing.length === 0;
  const allAdded = missing.length > 0 && missing.every((m) => onShoppingList.has(m.name));
  const modalCandidates = ingredients.filter((ing) => ing.skipped || !owned.has(ing.name));

  return (
    <div className="animate-fade-in-up pt-2">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className={`flex min-w-0 flex-1 gap-3 ${r.subtitle ? "items-start" : "items-center"}`}>
          {r.cover_photo_urls.length === 0 && r.icon_emoji && (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface text-2xl">
              {r.icon_emoji}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-bold">{r.title}</h1>
            {r.subtitle && <p className="mt-0.5 text-sm text-ink-soft">{r.subtitle}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ShareRecipeButton
            title={r.title}
            ingredients={ingredients.map((i) => (i.amount ? `${i.name} ${i.amount}` : i.name))}
            instructions={r.notes}
          />
          <Link
            href="/recipes"
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

      <p className="flex items-center gap-1.5 text-xs font-semibold text-accent">
        <ProfileAvatar iconEmoji={creatorProfile?.icon_emoji} nickname={creatorProfile?.nickname ?? ""} size={16} />
        {dict.recipes.registeredByTemplate.replace("{name}", chefName(creatorProfile?.nickname, dict))}
      </p>
      {r.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {r.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-positive-ink"
            >
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
                <img
                  src={referenceBookmark.thumbnail_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
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

      <div className="mt-5">
        <p className="mb-2 flex items-center gap-1.5">
          <span className="text-[15px] font-bold">{dict.welcome.ingredients}</span>
          <span className="text-xs text-ink-faint">
            {dict.recipes.ownedCountTemplate
              .replace("{owned}", String(activeIngredients.length - missing.length))
              .replace("{total}", String(activeIngredients.length))}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {ingredients.map((ing) => {
            const stateClass = ing.skipped
              ? "border-ink-faint bg-surface text-ink-faint"
              : owned.has(ing.name)
                ? "border-accent bg-surface text-accent-ink"
                : onShoppingList.has(ing.name)
                  ? "border-positive bg-surface text-positive-ink"
                  : "border-transparent bg-surface text-ink-soft";
            return (
              <span
                key={ing.id}
                className={`rounded-full border px-3.5 py-2 text-[13px] font-semibold ${stateClass}`}
              >
                {ing.name}
                {ing.amount && <span className="ml-1 font-normal opacity-70">{ing.amount}</span>}
                {ing.skipped && <span className="ml-1 text-[10px] font-normal">{dict.recipes.skippedSuffix}</span>}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        {makeable ? (
          <div className="flex items-center gap-2 rounded-xl border border-transparent bg-positive/10 px-3 py-2.5">
            <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="var(--color-positive-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 7.5l3 3 6-7" />
            </svg>
            <span className="text-[13px] font-bold text-positive-ink">{dict.recipes.makeableBadge}</span>
          </div>
        ) : allAdded ? (
          <div className="flex items-center justify-center gap-1.5 rounded-xl border border-transparent bg-surface py-2.5">
            <span className="text-[13px] font-bold text-ink-faint">{dict.welcome.addedToShoppingList}</span>
          </div>
        ) : (
          <MissingIngredientsButton
            recipeId={r.id}
            missing={modalCandidates.map((m) => ({ name: m.name, skipped: m.skipped }))}
          />
        )}
      </div>

      {r.notes && (
        <div className="mt-6">
          <p className="mb-2 text-[15px] font-bold">{dict.welcome.instructions}</p>
          <GlassCard className="bg-surface p-4">
            <p className="whitespace-pre-line text-sm text-ink">{r.notes}</p>
          </GlassCard>
        </div>
      )}

      <div className="mt-10 flex gap-2.5">
        <DeleteRecipeButton recipeId={r.id} />
        <Link
          href={`/recipes/${r.id}/edit`}
          className="flex-1 rounded-xl border border-accent bg-white py-3 text-center text-sm font-bold text-accent-ink"
        >
          {dict.recipes.editButton}
        </Link>
      </div>

      <ReactionLog recipeId={r.id} reactions={reactions ?? []} />
    </div>
  );
}
