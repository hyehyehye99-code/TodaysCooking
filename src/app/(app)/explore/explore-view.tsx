"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ClearableInput } from "@/components/ClearableInput";
import { searchExploreRecipes, type ExploreSearchResult } from "@/lib/actions/explore";
import { useDict } from "@/lib/i18n/client";
import type { ExploreCreator, ExploreFeedItem } from "./page";

// A 2-column grid of cards — distinct from both the 레시피 tab (single-
// column rows) and a big-photo feed (single column, one post at a time).
// A photo/video cover shows full-bleed on top when there is one; otherwise
// the emoji sits on a plain surface tile, same waterfall as elsewhere.
function ExploreFeedCard({ item, dict }: { item: ExploreFeedItem | ExploreSearchResult; dict: ReturnType<typeof useDict> }) {
  const photo = item.cover_photo_urls[0];
  return (
    <Link href={`/explore/recipe/${item.source}/${item.id}`} className="block overflow-hidden rounded-2xl border border-border bg-white">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="aspect-square w-full object-cover" />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center bg-surface text-4xl">
          {item.icon_emoji ?? "🍽️"}
        </div>
      )}
      <div className="p-2.5">
        <p className="truncate text-[13px] font-bold">{item.title || dict.recipes.untitledLink}</p>
        <p className="mt-0.5 truncate text-[11px] text-ink-soft">{item.creator_name}</p>
        {item.tags.length > 0 && (
          <p className="mt-1 truncate text-[10px] font-semibold text-positive-ink">
            {item.tags.map((tag) => `#${tag}`).join(" ")}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-accent-ink">
          <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" aria-hidden="true">
            <path d="M12 21s-7.5-4.6-10-9.2C.4 8.6 2 5 5.6 5c2 0 3.4 1 4.4 2.4C11 6 12.4 5 14.4 5 18 5 19.6 8.6 22 11.8 19.5 16.4 12 21 12 21z" />
          </svg>
          {item.add_count}
        </div>
      </div>
    </Link>
  );
}

function ExploreFeedGrid({ items, dict }: { items: (ExploreFeedItem | ExploreSearchResult)[]; dict: ReturnType<typeof useDict> }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <ExploreFeedCard key={`${item.source}-${item.id}`} item={item} dict={dict} />
      ))}
    </div>
  );
}

function ExploreCreatorCard({ creator, dict }: { creator: ExploreCreator; dict: ReturnType<typeof useDict> }) {
  return (
    <Link href={`/explore/creator/${creator.id}`} className="block overflow-hidden rounded-2xl border border-border bg-white">
      {creator.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={creator.avatar_url} alt="" className="aspect-square w-full object-cover" />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center bg-surface text-4xl">
          {creator.icon_emoji ?? "👤"}
        </div>
      )}
      <div className="p-2.5">
        <p className="truncate text-[13px] font-bold">{creator.name}</p>
        <p className="mt-0.5 truncate text-[11px] text-ink-soft">
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
}: {
  creators: ExploreCreator[];
  feed: ExploreFeedItem[];
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
  // creator list too — a union of the creator's own tags and whatever
  // tags their recipes in the combined feed carry.
  const creatorTagsById = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const c of creators) map.set(c.id, new Set(c.tags));
    for (const item of feed) {
      if (item.source !== "creator" || !item.creator_id) continue;
      const set = map.get(item.creator_id) ?? new Set<string>();
      item.tags.forEach((t) => set.add(t));
      map.set(item.creator_id, set);
    }
    return map;
  }, [creators, feed]);
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
            <ExploreFeedGrid items={results} dict={dict} />
          )}
        </div>
      ) : tab === "all" ? (
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
            <ExploreFeedGrid items={visibleFeed} dict={dict} />
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
            <div className="grid grid-cols-2 gap-3">
              {visibleCreators.map((c) => (
                <ExploreCreatorCard key={c.id} creator={c} dict={dict} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
