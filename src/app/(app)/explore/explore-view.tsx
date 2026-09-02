"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { RecipeThumb } from "@/components/RecipeThumb";
import { ClearableInput } from "@/components/ClearableInput";
import { searchExploreRecipes, type ExploreSearchResult } from "@/lib/actions/explore";
import { useDict } from "@/lib/i18n/client";
import type { ExploreCreator, ExploreFeedItem, ExploreCollection, ExploreBanner } from "./page";

// A horizontally scrollable strip of small recipe cards for one curated
// collection — bigger, squarer thumbnails than the list rows below since
// this is meant to read as a browsable shelf, not another list.
function CollectionSection({ collection, items, dict }: { collection: ExploreCollection; items: ExploreFeedItem[]; dict: ReturnType<typeof useDict> }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-7">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[15px] font-bold">
          {collection.emoji ? `${collection.emoji} ` : ""}
          {collection.title}
        </p>
        <Link href={`/explore/collection/${collection.id}`} className="text-xs font-bold text-ink-faint">
          {dict.components.more}
        </Link>
      </div>
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
        {items.map((item) => (
          <Link key={`${item.source}-${item.id}`} href={`/explore/recipe/${item.source}/${item.id}`} className="w-28 shrink-0">
            <RecipeThumb coverPhotoUrl={item.cover_photo_urls[0]} iconEmoji={item.icon_emoji} size={112} rounded="rounded-2xl" />
            <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-snug">{item.title || dict.recipes.untitledLink}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function BannerStrip({ banners }: { banners: ExploreBanner[] }) {
  if (banners.length === 0) return null;
  return (
    <div className="-mx-5 mb-7 flex gap-3 overflow-x-auto px-5 pb-1">
      {banners.map((b) => {
        const card = (
          <div className="flex h-[72px] w-64 shrink-0 items-center rounded-2xl bg-accent/10 px-4">
            <p className="text-sm font-bold text-accent-ink">
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

function ExploreCreatorRow({ creator, dict }: { creator: ExploreCreator; dict: ReturnType<typeof useDict> }) {
  return (
    <Link
      href={`/explore/creator/${creator.id}`}
      className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3.5"
    >
      <RecipeThumb coverPhotoUrl={creator.avatar_url} iconEmoji={creator.icon_emoji ?? "👤"} rounded="rounded-lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold">{creator.name}</p>
        <p className="mt-0.5 truncate text-xs text-ink-soft">
          {creator.channel_type}
          {creator.channel_type ? " · " : ""}
          {dict.explore.recipeCountTemplate.replace("{count}", String(creator.recipe_count))}
        </p>
      </div>
    </Link>
  );
}

export function ExploreView({
  creators,
  feed,
  collections,
  collectionRecipesById,
  banners,
}: {
  creators: ExploreCreator[];
  feed: ExploreFeedItem[];
  collections: ExploreCollection[];
  collectionRecipesById: Record<string, ExploreFeedItem[]>;
  banners: ExploreBanner[];
}) {
  const dict = useDict();
  const [tab, setTab] = useState<"all" | "creators">("all");
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [results, setResults] = useState<ExploreSearchResult[] | null>(null);
  const [pending, startTransition] = useTransition();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allTags = useMemo(() => [...new Set(feed.flatMap((item) => item.tags))], [feed]);
  const visibleFeed = activeTag ? feed.filter((item) => item.tags.includes(activeTag)) : feed;

  // Which tags each creator carries, so the same tag chips can filter the
  // creator list too — creators have no tags of their own, so this is
  // purely whatever tags their recipes in the combined feed carry.
  const creatorTagsById = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const item of feed) {
      if (item.source !== "creator" || !item.creator_id) continue;
      const set = map.get(item.creator_id) ?? new Set<string>();
      item.tags.forEach((t) => set.add(t));
      map.set(item.creator_id, set);
    }
    return map;
  }, [feed]);
  const creatorTagOptions = useMemo(
    () => [...new Set([...creatorTagsById.values()].flatMap((set) => [...set]))],
    [creatorTagsById]
  );
  const visibleCreators = creators.filter((c) => {
    const matchesQuery = !query.trim() || c.name.toLowerCase().includes(query.trim().toLowerCase());
    const matchesTag = !activeTag || creatorTagsById.get(c.id)?.has(activeTag);
    return matchesQuery && matchesTag;
  });

  function switchTab(next: "all" | "creators") {
    setTab(next);
    setQuery("");
    setActiveTag(null);
    setResults(null);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    // The creators tab filters the already-loaded `creators` list locally
    // (see visibleCreators above) — no server round trip needed for that.
    if (tab === "creators") return;
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
      <div className="mb-5 flex items-center justify-center gap-8 border-b border-border">
        <button
          type="button"
          onClick={() => switchTab("all")}
          className={`border-b-2 pb-2.5 text-sm ${
            tab === "all" ? "border-ink font-bold text-ink" : "border-transparent font-semibold text-ink-faint"
          }`}
        >
          {dict.explore.tabAll}
        </button>
        <button
          type="button"
          onClick={() => switchTab("creators")}
          className={`border-b-2 pb-2.5 text-sm ${
            tab === "creators" ? "border-ink font-bold text-ink" : "border-transparent font-semibold text-ink-faint"
          }`}
        >
          {dict.explore.tabCreators}
        </button>
      </div>

      <div className="mb-4">
        <ClearableInput
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={tab === "creators" ? dict.explore.searchCreatorsPlaceholder : dict.explore.searchPlaceholder}
          className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>

      {tab === "all" && results !== null ? (
        <div>
          {pending && <p className="mb-3 text-xs text-ink-faint">{dict.common.loading}</p>}
          {!pending && results.length === 0 ? (
            <p className="mt-10 text-center text-sm text-ink-soft">{dict.explore.noResults}</p>
          ) : (
            <ExploreFeedList items={results} dict={dict} />
          )}
        </div>
      ) : tab === "all" ? (
        <>
          <BannerStrip banners={banners} />
          {collections.map((c) => (
            <CollectionSection key={c.id} collection={c} items={collectionRecipesById[c.id] ?? []} dict={dict} />
          ))}

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
      ) : (
        <>
          {creatorTagOptions.length > 0 && (
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
              {creatorTagOptions.map((tag) => (
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

          {visibleCreators.length === 0 ? (
            <p className="mt-10 text-center text-sm text-ink-soft">
              {creators.length === 0 ? dict.explore.comingSoonDesc : dict.explore.noResults}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {visibleCreators.map((c) => (
                <ExploreCreatorRow key={c.id} creator={c} dict={dict} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
