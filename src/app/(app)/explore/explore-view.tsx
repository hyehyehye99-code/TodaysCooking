"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { RecipeThumb } from "@/components/RecipeThumb";
import { ClearableInput } from "@/components/ClearableInput";
import { searchExploreRecipes, type ExploreSearchResult } from "@/lib/actions/explore";
import { useDict } from "@/lib/i18n/client";
import type { ExploreFeedItem, ExploreCollection, ExploreBanner } from "./page";

// A horizontally scrollable shelf of recipe cards for one curated
// collection, wrapped in its own soft-shadowed white card so the curated
// area reads as a distinct, magazine-like block above the plain list rows
// further down the page.
function CollectionSection({ collection, items, dict }: { collection: ExploreCollection; items: ExploreFeedItem[]; dict: ReturnType<typeof useDict> }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-5 rounded-[28px] bg-[#fff7f2] p-4 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1.5 text-[19px] font-extrabold leading-tight text-ink">
          {collection.emoji && <span className="text-xl">{collection.emoji}</span>}
          <span className="truncate">{collection.title}</span>
        </p>
        <Link
          href={`/explore/collection/${collection.id}`}
          className="shrink-0 rounded-full bg-surface px-3 py-1.5 text-[11px] font-bold text-ink-soft"
        >
          {dict.components.more}
        </Link>
      </div>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {items.map((item) => (
          <Link key={`${item.source}-${item.id}`} href={`/explore/recipe/${item.source}/${item.id}`} className="w-[104px] shrink-0">
            <div className="rounded-2xl shadow-[0_6px_16px_-8px_rgba(0,0,0,0.25)]">
              <RecipeThumb coverPhotoUrl={item.cover_photo_urls[0]} iconEmoji={item.icon_emoji} size={104} rounded="rounded-2xl" />
            </div>
            <p className="mt-2 line-clamp-2 text-xs font-semibold leading-snug text-ink">{item.title || dict.recipes.untitledLink}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function BannerStrip({ banners }: { banners: ExploreBanner[] }) {
  if (banners.length === 0) return null;
  return (
    <div className="-mx-5 mb-6 flex gap-3 overflow-x-auto px-5 pb-1">
      {banners.map((b) => {
        const card = (
          <div className="relative flex h-24 w-72 shrink-0 items-center overflow-hidden rounded-[28px] bg-gradient-to-br from-accent to-orange-300 px-5 shadow-[0_10px_24px_-10px_rgba(251,85,45,0.55)]">
            {b.emoji && (
              <span aria-hidden className="absolute -right-3 -top-4 text-7xl opacity-25">
                {b.emoji}
              </span>
            )}
            <p className="relative text-[15px] font-extrabold leading-snug text-white">
              {b.emoji ? `${b.emoji} ` : ""}
              {b.title}
            </p>
          </div>
        );
        return b.link_url ? (
          <Link key={b.id} href={b.link_url}>
            {card}
          </Link>
        ) : (
          <div key={b.id}>{card}</div>
        );
      })}
    </div>
  );
}

// A list row — same visual weight as the 레시피 tab's rows (small square
// thumbnail + text). cover_photo_urls/icon_emoji fall through the same
// waterfall RecipeThumb already uses elsewhere.
function ExploreFeedRow({ item, dict }: { item: ExploreFeedItem | ExploreSearchResult; dict: ReturnType<typeof useDict> }) {
  return (
    <Link
      href={`/explore/recipe/${item.source}/${item.id}`}
      className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3.5"
    >
      <RecipeThumb coverPhotoUrl={item.cover_photo_urls[0]} iconEmoji={item.icon_emoji} rounded="rounded-lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold">{item.title || dict.recipes.untitledLink}</p>
        <p className="mt-0.5 truncate text-xs text-ink-soft">
          {item.creator_name}
          {item.subtitle ? ` · ${item.subtitle}` : ""}
        </p>
        {item.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span key={tag} className="text-[11px] font-semibold text-positive-ink">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function ExploreFeedList({ items, dict }: { items: (ExploreFeedItem | ExploreSearchResult)[]; dict: ReturnType<typeof useDict> }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <ExploreFeedRow key={`${item.source}-${item.id}`} item={item} dict={dict} />
      ))}
    </div>
  );
}

export function ExploreView({
  feed,
  collections,
  collectionRecipesById,
  banners,
}: {
  feed: ExploreFeedItem[];
  collections: ExploreCollection[];
  collectionRecipesById: Record<string, ExploreFeedItem[]>;
  banners: ExploreBanner[];
}) {
  const dict = useDict();
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [results, setResults] = useState<ExploreSearchResult[] | null>(null);
  const [pending, startTransition] = useTransition();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allTags = useMemo(() => [...new Set(feed.flatMap((item) => item.tags))], [feed]);
  const visibleFeed = activeTag ? feed.filter((item) => item.tags.includes(activeTag)) : feed;

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
      <BannerStrip banners={banners} />
      {collections.map((c) => (
        <CollectionSection key={c.id} collection={c} items={collectionRecipesById[c.id] ?? []} dict={dict} />
      ))}

      <div className="mb-4 mt-2 border-t border-border pt-6">
        <p className="mb-3 text-[15px] font-bold text-ink">{dict.explore.allRecipesHeading}</p>
        <ClearableInput
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={dict.explore.searchPlaceholder}
          className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>

      {results !== null ? (
        <div>
          {pending && <p className="mb-3 text-xs text-ink-faint">{dict.common.loading}</p>}
          {!pending && results.length === 0 ? (
            <p className="mt-10 text-center text-sm text-ink-soft">{dict.explore.noResults}</p>
          ) : (
            <ExploreFeedList items={results} dict={dict} />
          )}
        </div>
      ) : (
        <>
          {allTags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTag(null)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  activeTag === null ? "bg-accent text-white" : "bg-surface text-ink-soft"
                }`}
              >
                {dict.recipes.all}
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag((prev) => (prev === tag ? null : tag))}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    activeTag === tag ? "bg-accent text-white" : "bg-surface text-ink-soft"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {visibleFeed.length === 0 ? (
            <p className="mt-10 text-center text-sm text-ink-soft">{dict.explore.comingSoonDesc}</p>
          ) : (
            <ExploreFeedList items={visibleFeed} dict={dict} />
          )}
        </>
      )}
    </div>
  );
}
