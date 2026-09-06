"use client";

import { useMemo, useState } from "react";
import { RecipeThumb } from "@/components/RecipeThumb";
import { ClearableInput } from "@/components/ClearableInput";
import { useDict } from "@/lib/i18n/client";

type PickableRecipe = {
  id: string;
  title: string | null;
  cover_photo_urls: string[];
  icon_emoji: string | null;
};

export function RecipePicker({
  name,
  recipes,
  defaultSelected = [],
  untitledLabel,
}: {
  name: string;
  recipes: PickableRecipe[];
  defaultSelected?: string[];
  untitledLabel: string;
}) {
  const dict = useDict();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(defaultSelected);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((r) => (r.title ?? untitledLabel).toLowerCase().includes(q));
  }, [recipes, query, untitledLabel]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div>
      <input type="hidden" name={name} value={selected.join(",")} />
      <ClearableInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={dict.recipes.searchPlaceholder}
        className="mb-3 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
      />
      <div className="flex max-h-[360px] flex-col gap-1.5 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="py-6 text-center text-xs text-ink-faint">{dict.recipes.emptySearch}</p>
        )}
        {filtered.map((r) => {
          const active = selected.includes(r.id);
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => toggle(r.id)}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left ${
                active ? "border-accent bg-accent/8" : "border-transparent bg-surface"
              }`}
            >
              <RecipeThumb
                coverPhotoUrl={r.cover_photo_urls[0]}
                iconEmoji={r.icon_emoji}
                size={40}
                rounded="rounded-lg"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{r.title || untitledLabel}</span>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  active ? "border-accent bg-accent" : "border-border bg-white"
                }`}
              >
                {active && (
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12l5 5L20 6" />
                  </svg>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
