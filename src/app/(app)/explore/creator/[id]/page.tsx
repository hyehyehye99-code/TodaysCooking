import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";
import { fetchLinkPreview } from "@/lib/actions/link-preview";
import { RecipeThumb } from "@/components/RecipeThumb";
import { GlassCard } from "@/components/ui";

type Creator = {
  id: string;
  name: string;
  bio: string | null;
  icon_emoji: string | null;
  avatar_url: string | null;
  channel_type: string | null;
  channel_link: string | null;
};
type CreatorRecipe = {
  id: string;
  title: string;
  subtitle: string | null;
  cover_photo_urls: string[];
  icon_emoji: string | null;
  tags: string[];
};

export default async function CreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { dict } = await getDictionary();

  const [{ data: creator }, { data: recipes }] = await Promise.all([
    supabase.rpc("get_creator", { p_id: id }).maybeSingle(),
    supabase.rpc("get_creator_recipes", { p_creator_id: id }),
  ]);

  if (!creator) notFound();
  const c = creator as Creator;
  const list = (recipes as CreatorRecipe[] | null) ?? [];

  // Best-effort — if the fetch fails/times out, the link still falls back
  // to the plain "채널 보러가기" text link below.
  const channelPreview = c.channel_link ? await fetchLinkPreview(c.channel_link) : null;

  return (
    <div className="animate-fade-in-up pt-2">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {c.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.avatar_url} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface text-2xl">
              {c.icon_emoji ?? "👤"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[20px] font-bold">{c.name}</h1>
            {c.channel_type && <p className="mt-0.5 truncate text-xs font-semibold text-accent-ink">{c.channel_type}</p>}
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

      {c.bio && <p className="mb-3 text-sm leading-relaxed text-ink-soft">{c.bio}</p>}

      {c.channel_link && (
        <p className="mb-1.5 text-xs font-bold text-ink-soft">{dict.explore.channelLinkHeading}</p>
      )}
      {c.channel_link &&
        (channelPreview?.ok && (channelPreview.title || channelPreview.thumbnailUrl) ? (
          <a
            href={c.channel_link}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-5 flex items-center gap-3 rounded-2xl border border-border bg-white p-2.5"
          >
            {channelPreview.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={channelPreview.thumbnailUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="h-12 w-12 shrink-0 rounded-xl bg-surface" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{channelPreview.title ?? c.channel_link}</p>
              <p className="truncate text-xs text-ink-faint">{channelPreview.domain}</p>
            </div>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ink-faint">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </a>
        ) : (
          <a
            href={c.channel_link}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-5 inline-block text-xs font-bold text-accent-ink underline"
          >
            {dict.explore.viewChannel}
          </a>
        ))}

      <p className="mb-2.5 text-[15px] font-bold">{dict.explore.creatorRecipesHeading}</p>

      {list.length === 0 ? (
        <p className="mt-10 text-center text-sm text-ink-soft">{dict.explore.noPublicRecipes}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((recipe) => (
            <Link key={recipe.id} href={`/explore/recipe/creator/${recipe.id}`}>
              <GlassCard className="flex items-center gap-3 bg-white p-3.5">
                <RecipeThumb coverPhotoUrl={recipe.cover_photo_urls[0]} iconEmoji={recipe.icon_emoji} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold">{recipe.title}</p>
                  {recipe.subtitle && (
                    <p className="mt-0.5 truncate text-xs text-ink-soft">{recipe.subtitle}</p>
                  )}
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
