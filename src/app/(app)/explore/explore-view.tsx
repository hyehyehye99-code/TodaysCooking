"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
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

// A lean, text-first thread row — not a photo-forward card. Photos aren't
// the point here, so this deliberately skips cover_photo_urls entirely and
// only keeps a small emoji marker; rows are stacked in one continuous
// divided list (see ExploreFeedList below) rather than separate floating
// cards, which is what actually reads as "a list" instead of a feed of posts.
function ExploreFeedRow({ item, dict }: { item: ExploreFeedItem | ExploreSearchResult; dict: ReturnType<typeof useDict> }) {
  return (
    <Link href={`/explore/recipe/${item.source}/${item.id}`} className="block px-4 py-3.5">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0 text-lg leading-none">{item.icon_emoji ?? "🍽️"}</span>
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
        <span className="mt-0.5 flex shrink-0 items-center gap-1 text-[11px] font-bold text-accent-ink">
          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
            <path d="M12 21s-7.5-4.6-10-9.2C.4 8.6 2 5 5.6 5c2 0 3.4 1 4.4 2.4C11 6 12.4 5 14.4 5 18 5 19.6 8.6 22 11.8 19.5 16.4 12 21 12 21z" />
          </svg>
          {item.add_count}
        </span>
      </div>
    </Link>
  );
}

function ExploreFeedList({ items, dict }: { items: (ExploreFeedItem | ExploreSearchResult)[]; dict: ReturnType<typeof useDict> }) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
      {items.map((item) => (
        <ExploreFeedRow key={`${item.source}-${item.id}`} item={item} dict={dict} />
      ))}
    </div>
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
          <div className="mb-4 flex gap-1.5">
            <button
              type="button"
              onClick={() => setTab("all")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                tab === "all" ? "bg-accent text-white" : "bg-surface text-ink-soft"
              }`}
            >
              {dict.explore.tabAll}
            </button>
            <button
              type="button"
              onClick={() => setTab("creators")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                tab === "creators" ? "bg-accent text-white" : "bg-surface text-ink-soft"
              }`}
            >
              {dict.explore.tabCreators}
            </button>
          </div>

          {tab === "all" ? (
            feed.length === 0 ? (
              <p className="mt-10 text-center text-sm text-ink-soft">{dict.explore.comingSoonDesc}</p>
            ) : (
              <ExploreFeedList items={feed} dict={dict} />
            )
          ) : creators.length === 0 ? (
            <p className="mt-10 text-center text-sm text-ink-soft">{dict.explore.comingSoonDesc}</p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {creators.map((c) => (
                <Link key={c.id} href={`/explore/creator/${c.id}`} className="flex flex-col items-center gap-1.5">
                  <CreatorAvatar iconEmoji={c.icon_emoji} avatarUrl={c.avatar_url} size={72} />
                  <span className="max-w-full truncate text-xs font-semibold text-ink-soft">{c.name}</span>
                  <span className="text-[10px] text-ink-faint">
                    {dict.explore.recipeCountTemplate.replace("{count}", String(c.recipe_count))}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
