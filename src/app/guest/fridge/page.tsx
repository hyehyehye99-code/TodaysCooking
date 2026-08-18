"use client";

import { useState } from "react";
import { useGuestData } from "@/lib/guest/useGuestData";
import { INGREDIENT_CATEGORIES, ALL_KNOWN_INGREDIENTS } from "@/lib/ingredients";
import { GUEST_LIMITS } from "@/lib/guest/storage";
import { GlassCard, PageHeader } from "@/components/ui";

export default function GuestFridgePage() {
  const { data, update, hydrated } = useGuestData();
  const [customInput, setCustomInput] = useState("");

  if (!hydrated) return null;

  const stock = data.fridge;
  const ownedCount = Object.values(stock).filter(Boolean).length;
  const customNames = Object.keys(stock).filter((n) => !ALL_KNOWN_INGREDIENTS.has(n));
  const categories = customNames.length
    ? [...INGREDIENT_CATEGORIES, { name: "직접 추가", items: customNames }]
    : INGREDIENT_CATEGORIES;
  const atCap = customNames.length >= GUEST_LIMITS.fridgeCustom;

  function toggle(name: string) {
    update((prev) => ({ ...prev, fridge: { ...prev.fridge, [name]: !prev.fridge[name] } }));
  }

  function addCustom() {
    const name = customInput.trim();
    if (!name || atCap) return;
    update((prev) => ({ ...prev, fridge: { ...prev.fridge, [name]: true } }));
    setCustomInput("");
  }

  return (
    <div>
      <PageHeader title="냉장고" />

      <GlassCard className="mb-5 border-transparent bg-positive/8 px-4 py-3.5">
        <p className="text-sm font-bold text-positive-ink">{ownedCount}개 재료 보유 중</p>
        <p className="mt-0.5 text-xs text-positive-ink/70">
          가지고 있는 재료를 탭해서 표시해두면 레시피에 바로 반영돼요
        </p>
      </GlassCard>

      <div className="flex flex-col gap-5">
        {categories.map((cat) => (
          <div key={cat.name}>
            <p className="mb-2.5 text-xs font-bold text-ink-soft">{cat.name}</p>
            <div className="flex flex-wrap gap-2">
              {cat.items.map((name) => {
                const selected = !!stock[name];
                return (
                  <button
                    key={name}
                    onClick={() => toggle(name)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold ${
                      selected
                        ? "border-transparent bg-warn/14 text-warn-ink"
                        : "border-transparent bg-surface text-ink-soft"
                    }`}
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
                      className={selected ? "opacity-100" : "opacity-0"}
                    >
                      <path d="M2.5 7.5l3 3 6-7" />
                    </svg>
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-2">
        <input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder={atCap ? `최대 ${GUEST_LIMITS.fridgeCustom}개까지 추가할 수 있어요` : "다른 재료 직접 추가"}
          disabled={atCap}
          className="flex-1 rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-positive disabled:opacity-60"
        />
        <button
          onClick={addCustom}
          disabled={atCap}
          className="rounded-xl bg-positive px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          추가
        </button>
      </div>
    </div>
  );
}
