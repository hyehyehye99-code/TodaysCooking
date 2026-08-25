"use client";

import { useRef, useState } from "react";
import { saveFridge } from "@/lib/actions/fridge";
import { GlassCard } from "@/components/ui";
import { ClearableInput } from "@/components/ClearableInput";
import { useDict } from "@/lib/i18n/client";

type Item = { name: string; selected: boolean; custom: boolean };
type Category = { name: string; items: Item[] };

const LONG_PRESS_MS = 350;
const MOVE_CANCEL_PX = 10;

export function FridgeEditor({ categories }: { categories: Category[] }) {
  const dict = useDict();
  const [local, setLocal] = useState<Category[]>(categories);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  // Long-press-then-drag a chip into a different (open) category. The press
  // timer is what separates this from a normal tap — pointer capture is
  // deferred until the timer actually fires (not on every pointerdown),
  // otherwise capturing retargets the click and swallows plain taps.
  const [dragging, setDragging] = useState<{ catName: string; itemName: string; x: number; y: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const pressRef = useRef<{ catName: string; itemName: string; x: number; y: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  const catRefs = useRef<Map<string, HTMLElement>>(new Map());

  function registerCatRef(name: string) {
    return (el: HTMLElement | null) => {
      if (el) catRefs.current.set(name, el);
      else catRefs.current.delete(name);
    };
  }

  function findDropTarget(x: number, y: number, excludeCat: string) {
    for (const [name, el] of catRefs.current) {
      if (name === excludeCat) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return name;
    }
    return null;
  }

  function handleChipPointerDown(e: React.PointerEvent<HTMLButtonElement>, catName: string, itemName: string) {
    const startX = e.clientX;
    const startY = e.clientY;
    const target = e.currentTarget;
    const pointerId = e.pointerId;
    const timer = setTimeout(() => {
      target.setPointerCapture(pointerId);
      setDragging({ catName, itemName, x: startX, y: startY });
      pressRef.current = null;
    }, LONG_PRESS_MS);
    pressRef.current = { catName, itemName, x: startX, y: startY, timer };
  }

  function handleChipPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (dragging) {
      const x = e.clientX;
      const y = e.clientY;
      setDragging((d) => (d ? { ...d, x, y } : d));
      setDropTarget(findDropTarget(x, y, dragging.catName));
      return;
    }
    const press = pressRef.current;
    if (!press) return;
    if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > MOVE_CANCEL_PX) {
      clearTimeout(press.timer);
      pressRef.current = null;
    }
  }

  function handleChipPointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    if (pressRef.current) {
      clearTimeout(pressRef.current.timer);
      pressRef.current = null;
    }
    if (dragging) {
      if (dropTarget && dropTarget !== dragging.catName) {
        moveItem(dragging.catName, dropTarget, dragging.itemName);
      }
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // already released
      }
      setDragging(null);
      setDropTarget(null);
    }
  }

  function moveItem(fromCat: string, toCat: string, itemName: string) {
    const item = local.find((c) => c.name === fromCat)?.items.find((i) => i.name === itemName);
    if (!item || fromCat === toCat) return;

    setLocal((prev) =>
      prev.map((c) => {
        if (c.name === fromCat) return { ...c, items: c.items.filter((i) => i.name !== itemName) };
        if (c.name === toCat) return { ...c, items: [...c.items, item] };
        return c;
      })
    );
    void saveFridge([{ name: itemName, category: toCat, inStock: item.selected }]);
  }

  function toggleExpand(catName: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(catName)) next.delete(catName);
      else next.add(catName);
      return next;
    });
  }

  const allExpanded = local.length > 0 && local.every((c) => expanded.has(c.name));

  function toggleAllExpanded() {
    setExpanded(allExpanded ? new Set() : new Set(local.map((c) => c.name)));
  }

  const ownedCount = local.reduce((n, c) => n + c.items.filter((i) => i.selected).length, 0);
  const q = search.trim().toLowerCase();
  const matchesSearch = (name: string) => !q || name.toLowerCase().includes(q);

  function toggle(catName: string, itemName: string) {
    const item = local.find((c) => c.name === catName)?.items.find((i) => i.name === itemName);
    if (!item) return;
    const nextSelected = !item.selected;

    setLocal((prev) =>
      prev.map((c) =>
        c.name !== catName
          ? c
          : {
              ...c,
              items: c.items.map((i) =>
                i.name === itemName ? { ...i, selected: nextSelected } : i
              ),
            }
      )
    );
    void saveFridge([{ name: itemName, category: catName, inStock: nextSelected }]);
  }

  function removeCustom(catName: string, itemName: string) {
    setLocal((prev) =>
      prev.map((c) =>
        c.name !== catName ? c : { ...c, items: c.items.filter((i) => i.name !== itemName) }
      )
    );
    void saveFridge([], [itemName]);
  }

  function addCustomNamed(catName: string, rawValue: string) {
    const value = rawValue.trim();
    if (!value) return;
    const category = local.find((c) => c.name === catName);
    if (!category || category.items.some((i) => i.name === value)) return;

    setLocal((prev) =>
      prev.map((c) =>
        c.name !== catName
          ? c
          : { ...c, items: [...c.items, { name: value, selected: true, custom: true }] }
      )
    );
    void saveFridge([{ name: value, category: catName, inStock: true }]);
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
      <p className="mb-5 text-sm text-ink-soft">
        {dict.fridge.summaryTemplate.replace("{count}", String(ownedCount))}
      </p>

      <ClearableInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={dict.fridge.searchPlaceholder}
        className="mb-5 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
      />

      {!q && (
        <div className="-mt-2 mb-2 flex justify-end">
          <button type="button" onClick={toggleAllExpanded} className="px-4 py-2 text-xs font-bold text-accent">
            {allExpanded ? dict.fridge.collapseAll : dict.fridge.expandAll}
          </button>
        </div>
      )}

      {noMatches && (
        <GlassCard className="mb-5 border-transparent bg-surface p-4">
          <p className="mb-3 text-sm text-ink-soft">
            {dict.fridge.noMatchesTemplate.replace("{term}", search.trim())}
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
            const isDropTarget = dropTarget === cat.name;
            return (
            <div key={cat.name} className="border-b border-border py-3 last:border-none">
              <button
                type="button"
                onClick={() => toggleExpand(cat.name)}
                className="flex w-full items-center justify-between"
              >
                <span className="text-xs font-bold text-ink-soft">{cat.name}</span>
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
                <p
                  className={`mt-1.5 text-sm ${
                    ownedNames.length > 0 ? "text-ink" : "text-ink-faint"
                  }`}
                >
                  {ownedNames.length > 0 ? ownedNames.join(", ") : dict.fridge.noOwnedItems}
                </p>
              )}

              {isOpen && (
              <div
                ref={registerCatRef(cat.name)}
                className={`mt-3 flex flex-wrap items-center gap-2 rounded-2xl border-2 p-1.5 transition-colors ${
                  isDropTarget ? "border-dashed border-accent bg-accent/5" : "border-transparent"
                }`}
              >
                {cat.items.map((item) => {
                  const chipClass = item.selected
                    ? "bg-accent text-white"
                    : "bg-surface text-ink-soft";
                  const isBeingDragged = dragging?.catName === cat.name && dragging.itemName === item.name;

                  if (item.custom) {
                    return (
                      <span
                        key={item.name}
                        className={`inline-flex items-center rounded-full border border-transparent ${chipClass} ${
                          isBeingDragged ? "opacity-40" : ""
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggle(cat.name, item.name)}
                          onPointerDown={(e) => handleChipPointerDown(e, cat.name, item.name)}
                          onPointerMove={handleChipPointerMove}
                          onPointerUp={handleChipPointerUp}
                          className="touch-none py-2 pl-3.5 pr-1.5 text-[13px] font-semibold"
                        >
                          {item.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCustom(cat.name, item.name)}
                          aria-label={dict.common.delete}
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
                      onPointerDown={(e) => handleChipPointerDown(e, cat.name, item.name)}
                      onPointerMove={handleChipPointerMove}
                      onPointerUp={handleChipPointerUp}
                      className={`touch-none rounded-full border border-transparent px-3.5 py-2 text-[13px] font-semibold ${chipClass} ${
                        isBeingDragged ? "opacity-40" : ""
                      }`}
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
              )}
            </div>
            );
          })}
      </div>

      {dragging && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent px-3.5 py-2 text-[13px] font-semibold text-white shadow-lg"
          style={{ left: dragging.x, top: dragging.y }}
        >
          {dragging.itemName}
        </div>
      )}
    </div>
  );
}
