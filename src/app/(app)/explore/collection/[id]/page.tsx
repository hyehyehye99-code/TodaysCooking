import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";
import { RecipeThumb } from "@/components/RecipeThumb";
import { GlassCard } from "@/components/ui";

type Collection = { id: string; title: string; emoji: string | null };
type CollectionRecipe = {
  source: "creator" | "personal";
  id: string;
  title: string | null;
  subtitle: string | null;
  cover_photo_urls: string[];
  icon_emoji: string | null;
  tags: string[];
  creator_name: string;
};

export default async function ExploreCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { dict } = await getDictionary();

  const [{ data: collection }, { data: recipes }] = await Promise.all([
    supabase.rpc("get_collection", { p_id: id }).maybeSingle(),
    supabase.rpc("get_collection_recipes", { p_collection_id: id }),
  ]);

  if (!collection) notFound();
  const c = collection as Collection;
  const list = (recipes as CollectionRecipe[] | null) ?? [];

  return (
    <div className="animate-fade-in-up pt-2">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="truncate text-[20px] font-bold">
          {c.emoji ? `${c.emoji} ` : ""}
          {c.title}
        </h1>
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

      {list.length === 0 ? (
        <p className="mt-10 text-center text-sm text-ink-soft">{dict.explore.comingSoonDesc}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((recipe) => (
            <Link key={`${recipe.source}-${recipe.id}`} href={`/explore/recipe/${recipe.source}/${recipe.id}`}>
              <GlassCard className="flex items-center gap-3 bg-white p-3.5">
                <RecipeThumb coverPhotoUrl={recipe.cover_photo_urls[0]} iconEmoji={recipe.icon_emoji} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold">{recipe.title || dict.recipes.untitledLink}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-soft">
                    {recipe.creator_name}
                    {recipe.subtitle ? ` · ${recipe.subtitle}` : ""}
                  </p>
                  {recipe.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {recipe.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-semibold text-positive-ink">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
