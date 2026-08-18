"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveFridge } from "@/lib/actions/fridge";
import { GlassCard } from "@/components/ui";

type Item = { name: string; selected: boolean; custom: boolean };
type Category = { name: string; items: Item[] };

function cloneCategories(categories: Category[]): Category[] {
  return categories.map((c) => ({ name: c.name, items: c.items.map((i) => ({ ...i })) }));
}

export function FridgeEditor({ categories }: { categories: Category[] }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Category[]>(() => cloneCategories(categories));
  const [toDelete, setToDelete] = useState<string[]>([]);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const view = editing ? draft : categories;
  const ownedCount = view.reduce((n, c) => n + c.items.filter((i) => i.selected).length, 0);
  const q = search.trim().toLowerCase();
  const matchesSearch = (name: string) => !q || name.toLowerCase().includes(q);

  function startEdit() {
    setDraft(cloneCategories(categories));
    setToDelete([]);
    setCustomInputs({});
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function toggle(catName: string, itemName: string) {
    setDraft((prev) =>
      prev.map((c) =>
        c.name !== catName
          ? c
          : {
              ...c,
              items: c.items.map((i) =>
                i.name === itemName ? { ...i, selected: !i.selected } : i
              ),
            }
      )
    );
  }

  function removeCustom(catName: string, itemName: string) {
    setDraft((prev) =>
      prev.map((c) =>
        c.name !== catName ? c : { ...c, items: c.items.filter((i) => i.name !== itemName) }
      )
    );
    setToDelete((prev) => [...prev, itemName]);
  }

  function addCustomNamed(catName: string, rawValue: string) {
    const value = rawValue.trim();
    if (!value) return;
    setDraft((prev) =>
      prev.map((c) =>
        c.name !== catName
          ? c
          : c.items.some((i) => i.name === value)
            ? c
            : { ...c, items: [...c.items, { name: value, selected: true, custom: true }] }
      )
    );
    setToDelete((prev) => prev.filter((n) => n !== value));
  }

  function addCustom(catName: string) {
    addCustomNamed(catName, customInputs[catName] ?? "");
    setCustomInputs((prev) => ({ ...prev, [catName]: "" }));
  }

  function addSearchTermToCategory(catName: string) {
    addCustomNamed(catName, search);
    setSearch("");
  }

  function save() {
    const items = draft.flatMap((c) =>
      c.items.map((i) => ({ name: i.name, category: c.name, inStock: i.selected }))
    );
    startTransition(async () => {
      await saveFridge(items, toDelete);
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div>
      <GlassCard className="mb-5 border-transparent bg-accent/8 px-4 py-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-accent-ink">{ownedCount}개 재료 보유 중</p>
            <p className="mt-0.5 text-xs text-accent-ink/70">
              {editing
                ? "재료를 탭해서 표시하고, 저장하기를 눌러 반영하세요"
                : "수정하기를 눌러 냉장고 상태를 바꿀 수 있어요"}
            </p>
          </div>
          {editing ? (
            <div className="flex shrink-0 gap-2">
              <button
                onClick={cancelEdit}
                disabled={pending}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-ink-soft disabled:opacity-60"
              >
                취소
              </button>
              <button
                onClick={save}
                disabled={pending}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
              >
                {pending ? "저장 중..." : "저장하기"}
              </button>
            </div>
          ) : (
            <button
              onClick={startEdit}
              className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white"
            >
              수정하기
            </button>
          )}
        </div>
      </GlassCard>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="재료 검색"
        className="mb-5 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
      />

      {!editing && (() => {
        const hasAnyOwned = categories.some((c) => c.items.some((i) => i.selected));
        const visible = categories
          .map((cat) => ({
            ...cat,
            items: cat.items.filter((i) => i.selected && matchesSearch(i.name)),
          }))
          .filter((cat) => cat.items.length > 0);

        if (!hasAnyOwned) {
          return (
            <p className="mt-6 text-center text-sm text-ink-soft">
              아직 등록된 재료가 없어요. 수정하기를 눌러 추가해보세요.
            </p>
          );
        }
        if (visible.length === 0) {
          return <p className="mt-6 text-center text-sm text-ink-soft">검색 결과가 없어요.</p>;
        }
        return (
          <div className="flex flex-col gap-5">
            {visible.map((cat) => (
              <div key={cat.name}>
                <p className="mb-2 text-xs font-bold text-ink-soft">{cat.name}</p>
                <div className="flex flex-col">
                  {cat.items.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-2.5 border-b border-border py-2.5"
                    >
                      <svg
                        viewBox="0 0 14 14"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="var(--color-warn)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2.5 7.5l3 3 6-7" />
                      </svg>
                      <span className="text-[14px] font-semibold">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {editing && q && view.every((cat) => cat.items.every((i) => !matchesSearch(i.name))) && (
        <GlassCard className="mb-5 border-transparent bg-surface p-4">
          <p className="mb-3 text-sm text-ink-soft">
            <span className="font-bold text-ink">‘{search.trim()}’</span>을(를) 찾을 수 없어요.
            어느 칸에 추가할까요?
          </p>
          <div className="flex flex-wrap gap-2">
            {view.map((cat) => (
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

      {editing && (
      <div className="flex flex-col gap-5">
        {view
          .map((cat) => ({ ...cat, items: cat.items.filter((i) => matchesSearch(i.name)) }))
          .filter((cat) => cat.items.length > 0 || !q)
          .map((cat) => (
          <div key={cat.name}>
            <p className="mb-2.5 text-xs font-bold text-ink-soft">{cat.name}</p>
            <div className="flex flex-wrap items-center gap-2">
              {cat.items.map((item) => {
                const chipColor = item.selected
                  ? "text-warn-ink"
                  : "text-ink-soft";
                const chipBg = item.selected ? "bg-warn/14" : "bg-surface";

                if (editing && item.custom) {
                  return (
                    <span
                      key={item.name}
                      className={`inline-flex items-center rounded-full border border-transparent ${chipBg} ${chipColor}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggle(cat.name, item.name)}
                        className="flex items-center gap-1.5 py-2 pl-3.5 pr-1.5 text-[13px] font-semibold"
                      >
                        <svg
                          viewBox="0 0 14 14"
                          width="12"
                          height="12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={item.selected ? "opacity-100" : "opacity-0"}
                        >
                          <path d="M2.5 7.5l3 3 6-7" />
                        </svg>
                        {item.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCustom(cat.name, item.name)}
                        aria-label="삭제"
                        className="flex h-5 w-5 items-center justify-center pr-2.5 text-ink-faint"
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
                    disabled={!editing}
                    onClick={() => toggle(cat.name, item.name)}
                    className={`inline-flex items-center gap-1.5 rounded-full border border-transparent px-3.5 py-2 text-[13px] font-semibold ${chipBg} ${chipColor} ${editing ? "" : "cursor-default"}`}
                  >
                    <svg
                      viewBox="0 0 14 14"
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={item.selected ? "opacity-100" : "opacity-0"}
                    >
                      <path d="M2.5 7.5l3 3 6-7" />
                    </svg>
                    {item.name}
                  </button>
                );
              })}

              {editing && (
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
              )}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
