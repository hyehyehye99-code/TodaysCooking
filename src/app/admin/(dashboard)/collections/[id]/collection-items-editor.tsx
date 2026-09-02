"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  searchExploreRecipesForAdmin,
  addItemToCollection,
  removeItemFromCollection,
  type AdminExploreSearchResult,
} from "@/lib/actions/explore-collections";
import type { CollectionRecipeItem } from "./page";

export function CollectionItemsEditor({
  collectionId,
  items,
}: {
  collectionId: string;
  items: CollectionRecipeItem[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminExploreSearchResult[]>([]);
  const [pending, startTransition] = useTransition();
  const addedKeys = new Set(items.map((i) => `${i.source}-${i.id}`));

  function search(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    startTransition(async () => {
      setResults(await searchExploreRecipesForAdmin(value.trim()));
    });
  }

  function add(source: "creator" | "personal", id: string) {
    startTransition(async () => {
      await addItemToCollection(collectionId, source, id);
      router.refresh();
    });
  }

  function remove(source: "creator" | "personal", id: string) {
    startTransition(async () => {
      await removeItemFromCollection(collectionId, source, id);
      router.refresh();
    });
  }

  return (
    <div>
      <p className="mb-2 text-sm font-bold">레시피 추가</p>
      <input
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder="제목·태그·재료로 검색"
        className="mb-3 w-full max-w-sm rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
      />
      {query.trim() && (
        <div className="mb-6 overflow-hidden rounded-xl border border-border bg-white">
          {results.length === 0 ? (
            <p className="px-3.5 py-3 text-sm text-ink-soft">{pending ? "검색 중..." : "검색 결과가 없어요."}</p>
          ) : (
            <div className="divide-y divide-border">
              {results.map((r) => {
                const key = `${r.source}-${r.id}`;
                const already = addedKeys.has(key);
                return (
                  <div key={key} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{r.title ?? "제목 없음"}</p>
                      <p className="truncate text-xs text-ink-soft">{r.creator_name}</p>
                    </div>
                    <button
                      type="button"
                      disabled={already || pending}
                      onClick={() => add(r.source, r.id)}
                      className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                    >
                      {already ? "담김" : "담기"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <p className="mb-2 text-sm font-bold">담긴 레시피 ({items.length})</p>
      {items.length === 0 ? (
        <p className="text-sm text-ink-soft">아직 담긴 레시피가 없어요.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={`${item.source}-${item.id}`} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{item.title ?? "제목 없음"}</p>
                  <p className="truncate text-xs text-ink-soft">{item.creator_name}</p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(item.source, item.id)}
                  className="shrink-0 text-xs font-bold text-warn-ink disabled:opacity-40"
                >
                  빼기
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
