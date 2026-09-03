"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

// A hero card modeled directly on 오늘의집's home-feed banner: a wide photo
// (title overlaid on a bottom gradient scrim) with a strip of small preview
// thumbnails from the linked collection underneath, plus a "더보기" chip —
// so the card itself previews what tapping it opens, not just an image.
// Sized to ~92% width so a second banner peeks in when there's more than
// one. No image yet falls back to a plain gray mockup box.
function BannerCard({
  banner,
  collectionRecipesById,
  dict,
}: {
  banner: ExploreBanner;
  collectionRecipesById: Record<string, ExploreFeedItem[]>;
  dict: ReturnType<typeof useDict>;
}) {
  const href = banner.collection_id ? `/explore/collection/${banner.collection_id}` : banner.link_url;
  const previewItems = banner.collection_id ? (collectionRecipesById[banner.collection_id] ?? []).slice(0, 4) : [];

  const image = (
    <div className="relative aspect-[12/5] w-full overflow-hidden bg-[#e2e4e8]">
      {banner.image_url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner.image_url} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8">
            <p className="text-[17px] font-extrabold leading-snug text-white">
              {banner.emoji ? `${banner.emoji} ` : ""}
              {banner.title}
            </p>
          </div>
        </>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1">
          {banner.emoji && <span className="text-2xl">{banner.emoji}</span>}
          <span className="text-xs font-semibold text-ink-faint">{banner.title}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-[92%] shrink-0 snap-center overflow-hidden rounded-2xl border border-border bg-white">
      {href ? <Link href={href}>{image}</Link> : image}

      {previewItems.length > 0 && (
        <div className="flex items-center gap-2 p-3">
          {previewItems.map((item) => (
            <Link
              key={`${item.source}-${item.id}`}
              href={`/explore/recipe/${item.source}/${item.id}`}
              className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface"
            >
              {item.cover_photo_urls[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.cover_photo_urls[0]} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg">{item.icon_emoji ?? "🍳"}</div>
              )}
            </Link>
          ))}
          {href && (
            <Link
              href={href}
              className="ml-auto flex shrink-0 items-center gap-0.5 rounded-full bg-surface px-3 py-2 text-xs font-bold text-ink-soft"
            >
              {dict.explore.viewAllLabel}
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function BannerStrip({
  banners,
  collectionRecipesById,
  dict,
}: {
  banners: ExploreBanner[];
  collectionRecipesById: Record<string, ExploreFeedItem[]>;
  dict: ReturnType<typeof useDict>;
}) {
  if (banners.length === 0) return null;
  return (
    <div className="-mx-5 mb-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1">
      {banners.map((b) => (
        <BannerCard key={b.id} banner={b} collectionRecipesById={collectionRecipesById} dict={dict} />
      ))}
    </div>
  );
}

// Plain photo grid, Instagram-explore-style — no title/caption, just tap
// through to the recipe. Edge-to-edge (breaks out of the page's own
// horizontal padding) with hairline gaps between tiles.
function ExploreFeedGrid({ items }: { items: (ExploreFeedItem | ExploreSearchResult)[] }) {
  return (
    <div className="-mx-5 grid grid-cols-3 gap-0.5">
      {items.map((item) => (
        <Link
          key={`${item.source}-${item.id}`}
          href={`/explore/recipe/${item.source}/${item.id}`}
          className="relative aspect-square overflow-hidden bg-surface"
        >
          {item.cover_photo_urls[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.cover_photo_urls[0]} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl">{item.icon_emoji ?? "🍳"}</div>
          )}
        </Link>
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
  const router = useRouter();
  // The query lives in the URL (?q=...) specifically so that pressing back
  // after tapping into a search result lands on the same search instead of
  // a blank search bar — Next's router cache restores this exact URL's
  // state instantly, which plain useState across a full route change
  // wouldn't survive.
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [results, setResults] = useState<ExploreSearchResult[] | null>(null);
  const [pending, startTransition] = useTransition();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allTags = useMemo(() => [...new Set(feed.flatMap((item) => item.tags))], [feed]);
  const visibleFeed = activeTag ? feed.filter((item) => item.tags.includes(activeTag)) : feed;

  // Runs the restored query once on mount (e.g. landing on /explore?q=...
  // via back navigation) — typing itself is handled by handleQueryChange's
  // own debounced search below, not this effect.
  useEffect(() => {
    if (!initialQuery.trim()) return;
    startTransition(async () => {
      setResults(await searchExploreRecipes(initialQuery.trim()));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!value.trim()) {
      setResults(null);
      router.replace("/explore", { scroll: false });
      return;
    }
    debounceTimer.current = setTimeout(() => {
      startTransition(async () => {
        setResults(await searchExploreRecipes(value.trim()));
        router.replace(`/explore?q=${encodeURIComponent(value.trim())}`, { scroll: false });
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
            <ExploreFeedGrid items={results} />
          )}
        </div>
      ) : (
        <>
          <BannerStrip banners={banners} collectionRecipesById={collectionRecipesById} dict={dict} />
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
            <ExploreFeedGrid items={visibleFeed} />
          )}
        </>
      )}
    </div>
  );
}
