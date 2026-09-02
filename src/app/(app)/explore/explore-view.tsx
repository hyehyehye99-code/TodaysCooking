"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { RecipeThumb } from "@/components/RecipeThumb";
import { ClearableInput } from "@/components/ClearableInput";
import { searchExploreRecipes, type ExploreSearchResult } from "@/lib/actions/explore";
import { useDict } from "@/lib/i18n/client";
import type { ExploreFeedItem, ExploreCollection, ExploreBanner } from "./page";

// A shelf of small square cards for one curated collection — modeled on
// 배달의민족's "오늘만 이 가격" section: a plain "전체보기 >" heading link
// and item photos carrying a small pill badge (creator name, here) in the
// corner instead of a bottom gradient overlay or a full-card treatment.
function CollectionSection({ collection, items, dict }: { collection: ExploreCollection; items: ExploreFeedItem[]; dict: ReturnType<typeof useDict> }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-7">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1 text-[16px] font-bold text-ink">
          {collection.emoji && <span>{collection.emoji}</span>}
          <span className="truncate">{collection.title}</span>
        </p>
        <Link
          href={`/explore/collection/${collection.id}`}
          className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-ink-faint"
        >
          {dict.explore.viewAllLabel}
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
        {items.map((item) => (
          <Link key={`${item.source}-${item.id}`} href={`/explore/recipe/${item.source}/${item.id}`} className="w-[104px] shrink-0">
            <div className="relative h-[104px] w-[104px] overflow-hidden rounded-2xl bg-surface">
              {item.cover_photo_urls[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.cover_photo_urls[0]} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl">{item.icon_emoji ?? "🍳"}</div>
              )}
              <span className="absolute left-1.5 top-1.5 max-w-[calc(100%-12px)] truncate rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-accent-ink shadow-sm">
                {item.creator_name}
              </span>
            </div>
            <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-snug text-ink">{item.title || dict.recipes.untitledLink}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// A wide hero banner (3:1) sized to peek the next one when there's more
// than one — real content is a hosted image once the admin adds one, with
// the title overlaid on a dark gradient scrim like a magazine cover; until
// then it falls back to a plain gray mockup box so the slot's shape still
// reads correctly with nothing to show yet.
function BannerStrip({ banners }: { banners: ExploreBanner[] }) {
  if (banners.length === 0) return null;
  return (
    <div className="-mx-5 mb-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1">
      {banners.map((b) => {
        const inner = (
          <div className="relative aspect-[3/1] w-full overflow-hidden rounded-2xl bg-[#e2e4e8]">
            {b.image_url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.image_url} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8">
                  <p className="text-[15px] font-extrabold leading-snug text-white">
                    {b.emoji ? `${b.emoji} ` : ""}
                    {b.title}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                {b.emoji && <span className="text-2xl">{b.emoji}</span>}
                <span className="text-xs font-semibold text-ink-faint">{b.title}</span>
              </div>
            )}
          </div>
        );
        return b.link_url ? (
          <Link key={b.id} href={b.link_url} className="w-[88%] shrink-0 snap-center">
            {inner}
          </Link>
        ) : (
          <div key={b.id} className="w-[88%] shrink-0 snap-center">
            {inner}
          </div>
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
      <div className="mb-5">
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
          <BannerStrip banners={banners} />
          {collections.map((c) => (
            <CollectionSection key={c.id} collection={c} items={collectionRecipesById[c.id] ?? []} dict={dict} />
          ))}

          <div className="mb-4 mt-2 border-t border-border pt-6">
            <p className="mb-3 text-[15px] font-bold text-ink">{dict.explore.allRecipesHeading}</p>
          </div>

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
