"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setIngredientVisible, saveFridge } from "@/lib/actions/fridge";
import { ClearableInput } from "@/components/ClearableInput";
import { useDict } from "@/lib/i18n/client";

type Category = { name: string; items: string[] };

export function FridgeIngredientVisibilityList({
  categories,
  visibleNames,
}: {
  categories: Category[];
  visibleNames: string[];
}) {
  const dict = useDict();
  const router = useRouter();
  const [visible, setVisible] = useState<Set<string>>(() => new Set(visibleNames));
  const [added, setAdded] = useState<Record<string, string[]>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [, startTransition] = useTransition();

  const q = search.trim().toLowerCase();

  function toggle(name: string) {
    const nextVisible = !visible.has(name);
    setVisible((prev) => {
      const next = new Set(prev);
      if (nextVisible) next.add(name);
      else next.delete(name);
      return next;
    });
    startTransition(async () => {
      await setIngredientVisible(name, nextVisible);
      router.refresh();
    });
  }

  // Adds a brand-new ingredient the static catalog doesn't have — it lands
  // in the fridge tab as a not-yet-owned custom chip for that category
  // (same saveFridge path the fridge tab's own 직접 추가 uses), not in
  // fridge_visible_ingredients, since that table only gates the preset list.
  function addCustom(catName: string) {
    const value = (customInputs[catName] ?? "").trim();
    if (!value) return;
    setAdded((prev) => ({ ...prev, [catName]: [...(prev[catName] ?? []), value] }));
    setCustomInputs((prev) => ({ ...prev, [catName]: "" }));
    startTransition(async () => {
      await saveFridge([{ name: value, category: catName, inStock: false }]);
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
          const extra = (added[cat.name] ?? []).filter((name) => !q || name.toLowerCase().includes(q));
          if (items.length === 0 && extra.length === 0 && q) return null;
          return (
            <div key={cat.name} className="border-b border-border py-3 last:border-none">
              <p className="mb-3 text-xs font-bold text-ink-soft">{cat.name}</p>
              <div className="flex flex-wrap items-center gap-2">
                {items.map((name) => {
                  const isVisible = visible.has(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggle(name)}
                      className={`rounded-full border border-transparent px-3.5 py-2 text-[13px] font-semibold ${
                        isVisible ? "bg-accent text-white" : "bg-surface text-ink-faint"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
                {extra.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-accent/10 px-3.5 py-2 text-[13px] font-semibold text-accent-ink"
                  >
                    {name}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1 rounded-full border border-transparent bg-surface py-1 pl-3 pr-1.5">
                  <input
                    value={customInputs[cat.name] ?? ""}
                    onChange={(e) => setCustomInputs((prev) => ({ ...prev, [cat.name]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustom(cat.name);
                      }
                    }}
                    placeholder={dict.fridge.addCustomPlaceholder}
                    className="w-16 bg-transparent text-[13px] outline-none placeholder:text-ink-faint"
                  />
                  <button
                    type="button"
                    onClick={() => addCustom(cat.name)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white"
                  >
                    +
                  </button>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
