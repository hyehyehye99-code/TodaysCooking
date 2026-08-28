import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";
import { GlassCard } from "@/components/ui";
import { RecipePhotoGallery } from "@/app/(app)/recipes/[id]/recipe-photo-gallery";
import { AddToHouseholdButton } from "../../../add-to-household-button";
import { findHouseholdCopyOfExploreRecipe } from "@/lib/actions/explore";

type ExploreIngredient = { name: string; amount: string | null };

type ExploreRecipeDetail = {
  id: string;
  title: string | null;
  subtitle: string | null;
  cover_photo_urls: string[];
  icon_emoji: string | null;
  tags: string[];
  notes: string | null;
  ingredients: ExploreIngredient[];
  creator_name: string;
  creator_icon_emoji: string | null;
  add_count: number;
  source_url: string | null;
};

export default async function ExploreRecipeDetailPage({
  params,
}: {
  params: Promise<{ source: string; id: string }>;
}) {
  const { source, id } = await params;
  if (source !== "creator" && source !== "personal") notFound();

  const supabase = await createClient();
  const { dict } = await getDictionary();

  const [{ data }, alreadyAddedRecipeId] = await Promise.all([
    supabase.rpc(source === "creator" ? "get_creator_recipe" : "get_public_recipe", { p_id: id }).maybeSingle(),
    findHouseholdCopyOfExploreRecipe(source, id),
  ]);

  if (!data) notFound();
  const recipe = data as ExploreRecipeDetail;
  const displayTitle = recipe.title || dict.recipes.untitledLink;

  return (
    <div className="animate-fade-in-up pt-2">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className={`flex min-w-0 flex-1 gap-3 ${recipe.subtitle ? "items-start" : "items-center"}`}>
          {recipe.cover_photo_urls.length === 0 && recipe.icon_emoji && (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface text-2xl">
              {recipe.icon_emoji}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-bold">{displayTitle}</h1>
            {recipe.subtitle && <p className="mt-0.5 text-sm text-ink-soft">{recipe.subtitle}</p>}
          </div>
        </div>
        <Link
          href="/explore"
          aria-label={dict.common.close}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-ink"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </Link>
      </div>

      <RecipePhotoGallery photos={recipe.cover_photo_urls} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-accent">{recipe.creator_name}</p>
        <div className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-accent-ink">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v12" />
            <path d="M7 10l5 5 5-5" />
            <path d="M5 19h14" />
          </svg>
          {dict.explore.addedCountTemplate.replace("{count}", String(recipe.add_count))}
        </div>
      </div>

      {recipe.source_url && (
        <a
          href={recipe.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-accent-ink underline underline-offset-2"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 4h6v6" />
            <path d="M20 4 10 14" />
            <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
          </svg>
          {dict.explore.sourceLink}
        </a>
      )}

      {recipe.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {recipe.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-positive/10 px-2.5 py-1 text-[11px] font-bold text-positive-ink">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {recipe.ingredients.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[15px] font-bold">{dict.welcome.ingredients}</p>
          <div className="flex flex-wrap gap-2">
            {recipe.ingredients.map((ing) => (
              <span
                key={ing.name}
                className="rounded-full border border-transparent bg-surface px-3.5 py-2 text-[13px] font-bold text-ink"
              >
                {ing.name}
                {ing.amount && <span className="ml-1 font-normal opacity-70">{ing.amount}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {recipe.notes && (
        <div className="mt-6">
          <p className="mb-2 text-[15px] font-bold">{dict.welcome.instructions}</p>
          <GlassCard className="bg-surface p-4">
            <p className="whitespace-pre-line text-sm text-ink">{recipe.notes}</p>
          </GlassCard>
        </div>
      )}

      <div className="mt-8">
        <AddToHouseholdButton source={source} id={recipe.id} initialAddedRecipeId={alreadyAddedRecipeId} />
      </div>
    </div>
  );
}
