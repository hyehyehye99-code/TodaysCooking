"use client";

import { useState } from "react";
import { saveFridge, type FridgeSaveItem } from "@/lib/actions/fridge";
import { saveFridge as saveGuestFridge } from "@/lib/guest/store";
import { GlassCard } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { Mascot, type MascotName } from "@/components/Mascot";
import { ClearableInput } from "@/components/ClearableInput";
import { useDict } from "@/lib/i18n/client";
import { addDays, daysUntil, EXPIRING_SOON_DAYS, expiryLabel, expiryTone, todayKst } from "@/lib/expiry";

type Item = { name: string; selected: boolean; custom: boolean; expiresOn: string | null };
type Category = { name: string; items: Item[] };

// Mascot icon per category where there's a clean visual match — the rest fall
// back to a plain emoji.
const CATEGORY_MASCOT: Record<string, MascotName> = {
  "채소": "food-carrot",
  "해산물": "food-salmon",
  "육류·가공육": "food-chicken",
  "유제품·계란": "food-egg2",
  "곡류·면·떡": "food-noodles",
  "양념·향신료": "food-salt",
};
const CATEGORY_EMOJI: Record<string, string> = {
  "두부·콩류": "🫘",
  "김치·젓갈·장아찌": "🫙",
  "장류·오일": "🧴",
  "미분류": "📦",
};

function CategoryIcon({ name }: { name: string }) {
  return CATEGORY_MASCOT[name] ? <Mascot name={CATEGORY_MASCOT[name]} size={22} /> : <span>{CATEGORY_EMOJI[name] ?? "🍽️"}</span>;
}

// Soonest expiry first, undated last, then by name.
function byExpiry(a: Item, b: Item) {
  if (a.expiresOn && b.expiresOn) return a.expiresOn.localeCompare(b.expiresOn) || a.name.localeCompare(b.name);
  if (a.expiresOn) return -1;
  if (b.expiresOn) return 1;
  return a.name.localeCompare(b.name);
}

export function FridgeEditor({ categories, guest = false }: { categories: Category[]; guest?: boolean }) {
  const dict = useDict();
  // Signed-in: server action. Guest: this device's local store.
  const persist = async (items: FridgeSaveItem[], toDelete: string[] = []) => {
    if (guest) saveGuestFridge(items, toDelete);
    else await saveFridge(items, toDelete);
  };
  const [local, setLocal] = useState<Category[]>(categories);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const today = todayKst();

  const owned = local
    .map((c) => ({ ...c, items: c.items.filter((i) => i.selected).sort(byExpiry) }))
    .filter((c) => c.items.length > 0);
  const ownedCount = owned.reduce((n, c) => n + c.items.length, 0);
  const soon = owned
    .flatMap((c) => c.items)
    .filter((i) => i.expiresOn && daysUntil(i.expiresOn, today) <= EXPIRING_SOON_DAYS)
    .sort(byExpiry);

  function patchItem(catName: string, itemName: string, patch: Partial<Item>) {
    setLocal((prev) =>
      prev.map((c) =>
        c.name !== catName ? c : { ...c, items: c.items.map((i) => (i.name === itemName ? { ...i, ...patch } : i)) }
      )
    );
  }

  function setExpiry(catName: string, item: Item, expiresOn: string | null) {
    patchItem(catName, item.name, { expiresOn });
    void persist([{ name: item.name, category: catName, inStock: true, expiresOn }]);
  }

  // Taking something out clears its date; a custom item has nothing left to
  // remember, so it goes entirely.
  function removeItem(catName: string, item: Item) {
    setExpanded(null);
    if (item.custom) {
      setLocal((prev) => prev.map((c) => (c.name !== catName ? c : { ...c, items: c.items.filter((i) => i.name !== item.name) })));
      void persist([], [item.name]);
      return;
    }
    patchItem(catName, item.name, { selected: false, expiresOn: null });
    void persist([{ name: item.name, category: catName, inStock: false, expiresOn: null }]);
  }

  function moveCustom(fromCat: string, toCat: string, item: Item) {
    if (fromCat === toCat) return;
    setLocal((prev) =>
      prev.map((c) => {
        if (c.name === fromCat) return { ...c, items: c.items.filter((i) => i.name !== item.name) };
        if (c.name === toCat) return { ...c, items: [...c.items, item] };
        return c;
      })
    );
    void persist([{ name: item.name, category: toCat, inStock: true }]);
  }

  function toggleOwned(catName: string, item: Item) {
    const selected = !item.selected;
    patchItem(catName, item.name, { selected, ...(selected ? {} : { expiresOn: null }) });
    void persist([{ name: item.name, category: catName, inStock: selected, ...(selected ? {} : { expiresOn: null }) }]);
  }

  function addCustom(catName: string, rawName: string) {
    const name = rawName.trim();
    if (!name || local.some((c) => c.items.some((i) => i.name === name))) return;
    setLocal((prev) =>
      prev.map((c) =>
        c.name !== catName ? c : { ...c, items: [...c.items, { name, selected: true, custom: true, expiresOn: null }] }
      )
    );
    void persist([{ name, category: catName, inStock: true }]);
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          {ownedCount > 0 ? `${ownedCount}개 재료 보유 중` : "아직 담은 재료가 없어요"}
        </p>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="shrink-0 rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-white shadow-sm"
        >
          + 재료 추가
        </button>
      </div>

      {soon.length > 0 && (
        <GlassCard className="mb-5 bg-accent/10 p-4">
          <p className="text-[13px] font-bold text-accent-ink">⏰ 유통기한 임박 {soon.length}개</p>
          <p className="mt-1 text-sm text-ink">
            {soon.map((i) => `${i.name}(${expiryLabel(daysUntil(i.expiresOn!, today))})`).join(", ")}
          </p>
          <p className="mt-1.5 text-xs text-ink-soft">AI 셰프의 &lsquo;냉장고 파먹기&rsquo;가 이 재료부터 써서 추천해줘요.</p>
        </GlassCard>
      )}

      {owned.length === 0 && (
        <GlassCard className="bg-white px-6 py-10 text-center">
          <Mascot name="fridge-open" size={88} className="mx-auto" />
          <p className="mt-3 text-sm text-ink-soft">+ 재료 추가로 냉장고에 있는 재료를 담아보세요.</p>
        </GlassCard>
      )}

      <div className="flex flex-col gap-3">
        {owned.map((cat) => (
          <GlassCard key={cat.name} className="overflow-hidden bg-white">
            <p className="flex items-center gap-1.5 px-5 pb-1 pt-4 text-[13px] font-bold text-ink">
              <CategoryIcon name={cat.name} />
              {cat.name}
              <span className="text-xs font-semibold text-ink-faint">{cat.items.length}</span>
            </p>
            <div className="divide-y divide-border px-5">
              {cat.items.map((item) => {
                const key = `${cat.name}/${item.name}`;
                const open = expanded === key;
                const days = item.expiresOn ? daysUntil(item.expiresOn, today) : null;
                return (
                  <div key={item.name}>
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : key)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
                    >
                      <span className="min-w-0 truncate text-[15px] font-semibold text-ink">{item.name}</span>
                      {days !== null ? (
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${expiryTone(days)}`}>
                          {expiryLabel(days)}
                        </span>
                      ) : (
                        <span className="shrink-0 text-xs text-ink-faint">유통기한 입력</span>
                      )}
                    </button>

                    {open && (
                      <div className="mb-3.5 rounded-2xl bg-surface p-3.5">
                        <label className="flex items-center justify-between gap-3 text-[13px] font-semibold text-ink-soft">
                          유통기한
                          <input
                            type="date"
                            value={item.expiresOn ?? ""}
                            onChange={(e) => setExpiry(cat.name, item, e.target.value || null)}
                            className="rounded-xl border border-transparent bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                          />
                        </label>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {[3, 7, 14, 30].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setExpiry(cat.name, item, addDays(today, d))}
                              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft"
                            >
                              {d === 7 ? "1주" : d === 14 ? "2주" : d === 30 ? "1달" : `${d}일`} 후
                            </button>
                          ))}
                          {item.expiresOn && (
                            <button
                              type="button"
                              onClick={() => setExpiry(cat.name, item, null)}
                              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink-faint"
                            >
                              날짜 지우기
                            </button>
                          )}
                        </div>
                        {item.custom && (
                          <label className="mt-3 flex items-center justify-between gap-3 text-[13px] font-semibold text-ink-soft">
                            분류
                            <select
                              value={cat.name}
                              onChange={(e) => moveCustom(cat.name, e.target.value, item)}
                              className="rounded-xl bg-white px-3 py-2 text-sm text-ink outline-none"
                            >
                              {local.map((c) => (
                                <option key={c.name} value={c.name}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                        <button
                          type="button"
                          onClick={() => removeItem(cat.name, item)}
                          className="mt-3 w-full rounded-xl bg-white py-2.5 text-sm font-bold text-warn-ink"
                        >
                          냉장고에서 빼기
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </GlassCard>
        ))}
      </div>

      <AddSheet
        open={adding}
        onClose={() => setAdding(false)}
        categories={local}
        onToggle={toggleOwned}
        onAddCustom={addCustom}
        dict={dict}
      />
    </div>
  );
}

// Pick what's in the fridge: every known ingredient by category as a checklist,
// plus a way to add something that isn't listed.
function AddSheet({
  open,
  onClose,
  categories,
  onToggle,
  onAddCustom,
  dict,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  onToggle: (catName: string, item: Item) => void;
  onAddCustom: (catName: string, name: string) => void;
  dict: ReturnType<typeof useDict>;
}) {
  const [search, setSearch] = useState("");
  const [customCat, setCustomCat] = useState("미분류");
  const q = search.trim().toLowerCase();
  const filtered = categories
    .map((c) => ({ ...c, items: c.items.filter((i) => !q || i.name.toLowerCase().includes(q)) }))
    .filter((c) => c.items.length > 0);
  const exact = categories.some((c) => c.items.some((i) => i.name.toLowerCase() === q));

  return (
    <Modal open={open} onClose={onClose} variant="sheet">
      <div className="mx-auto flex max-h-[85dvh] w-full max-w-[420px] flex-col rounded-t-3xl bg-white pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="shrink-0 px-5 pb-3 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[17px] font-bold text-ink">재료 추가</p>
            <button type="button" onClick={onClose} className="rounded-full bg-surface px-3.5 py-1.5 text-sm font-bold text-ink-soft">
              완료
            </button>
          </div>
          <ClearableInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={dict.fridge.searchPlaceholder}
            className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>

        <div className="overflow-y-auto overscroll-contain px-5 pb-2">
          {q && !exact && (
            <div className="mb-3 flex items-center gap-2 rounded-2xl bg-accent/10 p-3">
              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-accent-ink">&lsquo;{search.trim()}&rsquo; 직접 추가</p>
              <select
                value={customCat}
                onChange={(e) => setCustomCat(e.target.value)}
                className="rounded-xl bg-white px-2.5 py-2 text-xs font-semibold text-ink outline-none"
              >
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  onAddCustom(customCat, search);
                  setSearch("");
                }}
                className="rounded-xl bg-accent px-3.5 py-2 text-xs font-bold text-white"
              >
                추가
              </button>
            </div>
          )}

          {filtered.map((cat) => (
            <div key={cat.name} className="mb-3">
              <p className="flex items-center gap-1.5 py-2 text-[13px] font-bold text-ink-soft">
                <CategoryIcon name={cat.name} />
                {cat.name}
              </p>
              <div className="divide-y divide-border">
                {cat.items.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => onToggle(cat.name, item)}
                    aria-pressed={item.selected}
                    className="flex w-full items-center justify-between py-3 text-left"
                  >
                    <span className={`text-[15px] ${item.selected ? "font-bold text-ink" : "font-medium text-ink-soft"}`}>
                      {item.name}
                    </span>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold text-white ${
                        item.selected ? "border-accent bg-accent" : "border-border bg-white"
                      }`}
                    >
                      {item.selected && "✓"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
