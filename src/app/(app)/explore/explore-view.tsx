"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { RecipeThumb } from "@/components/RecipeThumb";
import { ClearableInput } from "@/components/ClearableInput";
import { searchExploreRecipes, type ExploreSearchResult } from "@/lib/actions/explore";
import { useDict } from "@/lib/i18n/client";
import type { ExploreCreator, ExplorePublicRecipe } from "./page";

function CreatorAvatar({ iconEmoji, avatarUrl, size = 56 }: { iconEmoji: string | null; avatarUrl?: string | null; size?: number }) {
  const style = { width: size, height: size };
  if (avatarUrl) {
    return (
      <div style={style} className="shrink-0 overflow-hidden rounded-full bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div style={style} className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface text-2xl">
      {iconEmoji ?? "👤"}
    </div>
  );
}

export function ExploreView({
  creators,
  publicRecipes,
}: {
  creators: ExploreCreator[];
  publicRecipes: ExplorePublicRecipe[];
}) {
  const dict = useDict();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExploreSearchResult[] | null>(null);
  const [pending, startTransition] = useTransition();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!value.trim()) {
      setResults(null);
      return;
    }
    debounceTimer.current = setTimeout(() => {
      startTransition(async () => {
        setResults(await searchExploreRecipes(value.trim()));
      });
    }, 300);
  }

  return (
    <div>
      <ClearableInput
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        placeholder={dict.explore.searchPlaceholder}
        className="mb-5 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
      />

      {results !== null ? (
        <div className="flex flex-col gap-3">
          {pending && <p className="text-xs text-ink-faint">{dict.common.loading}</p>}
          {!pending && results.length === 0 && (
            <p className="mt-10 text-center text-sm text-ink-soft">{dict.explore.noResults}</p>
          )}
          {results.map((r) => (
            <Link key={`${r.source}-${r.id}`} href={`/explore/recipe/${r.source}/${r.id}`}>
              <GlassCard className="flex items-center gap-3 bg-white p-3.5">
                <RecipeThumb coverPhotoUrl={r.cover_photo_urls[0]} iconEmoji={r.icon_emoji} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold">{r.title || dict.recipes.untitledLink}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-soft">{r.creator_name}</p>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      ) : (
        <>
          {creators.length > 0 && (
            <div className="mb-6">
              <p className="mb-2.5 text-[15px] font-bold">{dict.explore.creatorsHeading}</p>
              <div className="flex gap-4 overflow-x-auto pb-1">
                {creators.map((c) => (
                  <Link key={c.id} href={`/explore/creator/${c.id}`} className="flex shrink-0 flex-col items-center gap-1.5">
                    <CreatorAvatar iconEmoji={c.icon_emoji} avatarUrl={c.avatar_url} />
                    <span className="max-w-[64px] truncate text-[11px] font-semibold text-ink-soft">{c.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2.5 text-[15px] font-bold">{dict.explore.publicRecipesHeading}</p>
            {publicRecipes.length === 0 && creators.length === 0 ? (
              <p className="mt-10 text-center text-sm text-ink-soft">{dict.explore.comingSoonDesc}</p>
            ) : publicRecipes.length === 0 ? (
              <p className="text-center text-sm text-ink-soft">{dict.explore.noPublicRecipes}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {publicRecipes.map((r) => (
                  <Link key={r.id} href={`/explore/recipe/personal/${r.id}`}>
                    <GlassCard className="flex items-center gap-3 bg-white p-3.5">
                      <RecipeThumb coverPhotoUrl={r.cover_photo_urls[0]} iconEmoji={r.icon_emoji} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-bold">{r.title || dict.recipes.untitledLink}</p>
                        <p className="mt-0.5 truncate text-xs text-ink-soft">{r.creator_name}</p>
                        {r.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {r.tags.map((tag) => (
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
        </>
      )}
    </div>
  );
}
