"use client";

import { useState, useTransition } from "react";
import { saveFridge } from "@/lib/actions/fridge";
import { GlassCard } from "@/components/ui";

type Item = { name: string; selected: boolean; custom: boolean };
type Category = { name: string; items: Item[] };

export function FridgeEditor({ categories }: { categories: Category[] }) {
  const [local, setLocal] = useState<Category[]>(categories);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(categories.filter((c) => c.items.some((i) => i.selected)).map((c) => c.name))
  );
  const [, startTransition] = useTransition();

  function toggleExpand(catName: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(catName)) next.delete(catName);
      else next.add(catName);
      return next;
    });
  }

  const ownedCount = local.reduce((n, c) => n + c.items.filter((i) => i.selected).length, 0);
  const q = search.trim().toLowerCase();
  const matchesSearch = (name: string) => !q || name.toLowerCase().includes(q);

  function toggle(catName: string, itemName: string) {
    let nextSelected = false;
    setLocal((prev) =>
      prev.map((c) => {
        if (c.name !== catName) return c;
        return {
          ...c,
          items: c.items.map((i) => {
            if (i.name !== itemName) return i;
            nextSelected = !i.selected;
            return { ...i, selected: nextSelected };
          }),
        };
      })
    );
    startTransition(async () => {
      await saveFridge([{ name: itemName, category: catName, inStock: nextSelected }]);
    });
  }

  function removeCustom(catName: string, itemName: string) {
    setLocal((prev) =>
      prev.map((c) =>
        c.name !== catName ? c : { ...c, items: c.items.filter((i) => i.name !== itemName) }
      )
    );
    startTransition(async () => {
      await saveFridge([], [itemName]);
    });
  }

  function addCustomNamed(catName: string, rawValue: string) {
    const value = rawValue.trim();
    if (!value) return;
    let added = false;
    setLocal((prev) =>
      prev.map((c) => {
        if (c.name !== catName) return c;
        if (c.items.some((i) => i.name === value)) return c;
        added = true;
        return { ...c, items: [...c.items, { name: value, selected: true, custom: true }] };
      })
    );
    if (added) {
      startTransition(async () => {
        await saveFridge([{ name: value, category: catName, inStock: true }]);
      });
    }
  }

  function addCustom(catName: string) {
    addCustomNamed(catName, customInputs[catName] ?? "");
    setCustomInputs((prev) => ({ ...prev, [catName]: "" }));
  }

  function addSearchTermToCategory(catName: string) {
    addCustomNamed(catName, search);
    setSearch("");
  }

  const noMatches = !!q && local.every((cat) => cat.items.every((i) => !matchesSearch(i.name)));

  return (
    <div>
      <GlassCard className="mb-5 border-transparent bg-accent/8 px-4 py-3.5">
        <p className="text-sm font-bold text-accent-ink">{ownedCount}개 재료 보유 중</p>
        <p className="mt-0.5 text-xs text-accent-ink/70">탭하면 바로 추가되거나 빠져요</p>
      </GlassCard>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="재료 검색"
        className="mb-5 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
      />

      {noMatches && (
        <GlassCard className="mb-5 border-transparent bg-surface p-4">
          <p className="mb-3 text-sm text-ink-soft">
            <span className="font-bold text-ink">&lsquo;{search.trim()}&rsquo;</span>을(를) 찾을 수 없어요.
            어느 칸에 추가할까요?
          </p>
          <div className="flex flex-wrap gap-2">
            {local.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => addSearchTermToCategory(cat.name)}
                className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent"
              >
                + {cat.name}
              </button>
            ))}
          </div>
        </GlassCard>
      )}

      <div className="flex flex-col gap-1">
        {local
          .map((cat) => ({ ...cat, items: cat.items.filter((i) => matchesSearch(i.name)) }))
          .filter((cat) => cat.items.length > 0 || !q)
          .map((cat) => {
            const isOpen = !!q || expanded.has(cat.name);
            const ownedNames = cat.items.filter((i) => i.selected).map((i) => i.name);
            return (
            <div key={cat.name} className="border-b border-border py-3 last:border-none">
              <button
                type="button"
                onClick={() => toggleExpand(cat.name)}
                className="flex w-full items-center justify-between"
              >
                <span className="text-[13px] font-bold text-ink">{cat.name}</span>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="var(--color-ink-faint)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {!isOpen && (
                <p className="mt-1.5 text-xs text-ink-faint">
                  {ownedNames.length > 0 ? ownedNames.join(", ") : "보유한 재료가 없어요"}
                </p>
              )}

              {isOpen && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {cat.items.map((item) => {
                  const chipClass = item.selected
                    ? "bg-accent text-white"
                    : "bg-surface text-ink-soft";

                  if (item.custom) {
                    return (
                      <span
                        key={item.name}
                        className={`inline-flex items-center rounded-full border border-transparent ${chipClass}`}
                      >
                        <button
                          type="button"
                          onClick={() => toggle(cat.name, item.name)}
                          className="py-2 pl-3.5 pr-1.5 text-[13px] font-semibold"
                        >
                          {item.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCustom(cat.name, item.name)}
                          aria-label="삭제"
                          className="flex h-5 w-5 items-center justify-center pr-2.5 text-xs opacity-70"
                        >
                          ×
                        </button>
                      </span>
                    );
                  }

                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => toggle(cat.name, item.name)}
                      className={`rounded-full border border-transparent px-3.5 py-2 text-[13px] font-semibold ${chipClass}`}
                    >
                      {item.name}
                    </button>
                  );
                })}

                <span className="inline-flex items-center gap-1 rounded-full border border-transparent bg-surface py-1 pl-3 pr-1.5">
                  <input
                    value={customInputs[cat.name] ?? ""}
                    onChange={(e) =>
                      setCustomInputs((prev) => ({ ...prev, [cat.name]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustom(cat.name);
                      }
                    }}
                    placeholder="직접 추가"
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
              )}
            </div>
            );
          })}
      </div>
    </div>
  );
}
