"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { ClearableInput } from "@/components/ClearableInput";
import { searchExploreRecipes, type ExploreSearchResult } from "@/lib/actions/explore";
import { useDict } from "@/lib/i18n/client";
import type { ExploreCreator, ExploreFeedItem } from "./page";

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

// A thread/feed-style card — deliberately much bigger and more vertical
// than the compact rows on the 레시피 tab (RecipeThumb + one-line text), so
// browsing Explore doesn't feel like just another recipe list.
function ExploreFeedCard({ item, dict }: { item: ExploreFeedItem | ExploreSearchResult; dict: ReturnType<typeof useDict> }) {
  const photo = item.cover_photo_urls[0];
  return (
    <Link href={`/explore/recipe/${item.source}/${item.id}`}>
      <GlassCard className="overflow-hidden bg-white">
        <div className="flex items-center gap-2 px-4 pt-3.5">
          <CreatorAvatar iconEmoji={item.creator_icon_emoji} size={28} />
          <span className="min-w-0 flex-1 truncate text-xs font-bold text-ink-soft">{item.creator_name}</span>
        </div>

        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="mt-3 aspect-[4/3] w-full object-cover" />
        ) : (
          <div className="mt-3 flex aspect-[4/3] w-full items-center justify-center bg-surface text-[56px]">
            {item.icon_emoji ?? "🍽️"}
          </div>
        )}

        <div className="p-4">
          <p className="text-[16px] font-bold">{item.title || dict.recipes.untitledLink}</p>
          {item.subtitle && <p className="mt-0.5 text-sm text-ink-soft">{item.subtitle}</p>}
          {item.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span key={tag} className="text-[11px] font-semibold text-positive-ink">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-xs font-bold text-accent-ink">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path d="M12 21s-7.5-4.6-10-9.2C.4 8.6 2 5 5.6 5c2 0 3.4 1 4.4 2.4C11 6 12.4 5 14.4 5 18 5 19.6 8.6 22 11.8 19.5 16.4 12 21 12 21z" />
            </svg>
            {dict.explore.addedCountTemplate.replace("{count}", String(item.add_count))}
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}

export function ExploreView({
  creators,
  feed,
}: {
  creators: ExploreCreator[];
  feed: ExploreFeedItem[];
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
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <ClearableInput
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={dict.explore.searchPlaceholder}
            className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <Link href="/explore/my-recipes" className="shrink-0 text-xs font-bold text-accent">
          {dict.explore.myRecipesLink}
        </Link>
      </div>

      {results !== null ? (
        <div className="flex flex-col gap-4">
          {pending && <p className="text-xs text-ink-faint">{dict.common.loading}</p>}
          {!pending && results.length === 0 && (
            <p className="mt-10 text-center text-sm text-ink-soft">{dict.explore.noResults}</p>
          )}
          {results.map((r) => (
            <ExploreFeedCard key={`${r.source}-${r.id}`} item={r} dict={dict} />
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

          {feed.length === 0 ? (
            <p className="mt-10 text-center text-sm text-ink-soft">{dict.explore.comingSoonDesc}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {feed.map((item) => (
                <ExploreFeedCard key={`${item.source}-${item.id}`} item={item} dict={dict} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
