"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setIngredientHidden } from "@/lib/actions/fridge";
import { ClearableInput } from "@/components/ClearableInput";
import { useDict } from "@/lib/i18n/client";

type Category = { name: string; items: string[] };

export function FridgeIngredientVisibilityList({
  categories,
  hiddenNames,
}: {
  categories: Category[];
  hiddenNames: string[];
}) {
  const dict = useDict();
  const router = useRouter();
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(hiddenNames));
  const [search, setSearch] = useState("");
  const [, startTransition] = useTransition();

  const q = search.trim().toLowerCase();

  function toggle(name: string) {
    const nextHidden = !hidden.has(name);
    setHidden((prev) => {
      const next = new Set(prev);
      if (nextHidden) next.add(name);
      else next.delete(name);
      return next;
    });
    startTransition(async () => {
      await setIngredientHidden(name, nextHidden);
      router.refresh();
    });
  }

  return (
    <div>
      <ClearableInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={dict.fridge.searchPlaceholder}
        className="mb-5 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
      />

      <div className="flex flex-col gap-1">
        {categories.map((cat) => {
          const items = cat.items.filter((name) => !q || name.toLowerCase().includes(q));
          if (items.length === 0) return null;
          return (
            <div key={cat.name} className="border-b border-border py-3 last:border-none">
              <p className="mb-3 text-xs font-bold text-ink-soft">{cat.name}</p>
              <div className="flex flex-wrap items-center gap-2">
                {items.map((name) => {
                  const isHidden = hidden.has(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggle(name)}
                      className={`rounded-full border border-transparent px-3.5 py-2 text-[13px] font-semibold ${
                        isHidden ? "bg-surface text-ink-faint line-through" : "bg-accent text-white"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
