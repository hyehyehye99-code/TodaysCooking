"use client";

import { useState } from "react";
import { useGuestData } from "@/lib/guest/useGuestData";
import { GUEST_LIMITS, newId } from "@/lib/guest/storage";
import { GlassCard, PageHeader, ProgressBar } from "@/components/ui";

export default function GuestShoppingPage() {
  const { data, update, hydrated } = useGuestData();
  const [name, setName] = useState("");

  if (!hydrated) return null;

  const items = data.shopping;
  const doneCount = items.filter((i) => i.checked).length;
  const percent = items.length ? (doneCount / items.length) * 100 : 0;
  const atCap = items.length >= GUEST_LIMITS.shopping;

  function toggle(id: string) {
    update((prev) => ({
      ...prev,
      shopping: prev.shopping.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
    }));
  }

  function add() {
    const value = name.trim();
    if (!value || atCap) return;
    update((prev) => ({
      ...prev,
      shopping: [...prev.shopping, { id: newId(), name: value, checked: false, sourceRecipeTitle: null }],
    }));
    setName("");
  }

  function clearChecked() {
    update((prev) => ({ ...prev, shopping: prev.shopping.filter((i) => !i.checked) }));
  }

  return (
    <div>
      <PageHeader title="장보기" />

      <GlassCard className="mb-[18px] bg-white p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[13px] font-bold">이번 장보기</span>
          <span className="text-xs font-bold text-accent">
            {doneCount}/{items.length} 완료
          </span>
        </div>
        <ProgressBar percent={percent} colorClass="bg-accent" />
      </GlassCard>

      <div className="mb-2 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={atCap ? `최대 ${GUEST_LIMITS.shopping}개까지 담을 수 있어요` : "+ 항목 추가"}
          disabled={atCap}
          className="flex-1 rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent disabled:opacity-60"
        />
        <button
          onClick={add}
          disabled={atCap}
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          추가
        </button>
      </div>

      {items.length === 0 ? (
        <p className="mt-10 text-center text-sm text-ink-soft">장보기 목록이 비어 있어요.</p>
      ) : (
        <div className="flex flex-col">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className="flex items-center gap-3 border-b border-border py-3 text-left"
            >
              <span
                className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border-[1.5px] ${
                  item.checked ? "border-positive bg-positive" : "border-border bg-surface"
                }`}
              >
                {item.checked && (
                  <svg
                    viewBox="0 0 14 14"
                    width="13"
                    height="13"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2.5 7.5l3 3 6-7" />
                  </svg>
                )}
              </span>
              <span className="flex-1">
                <p className={`text-sm font-semibold ${item.checked ? "text-ink-faint line-through" : ""}`}>
                  {item.name}
                </p>
                {item.sourceRecipeTitle && (
                  <p className="mt-0.5 text-[11px] text-ink-faint">{item.sourceRecipeTitle} 재료</p>
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      {doneCount > 0 && (
        <button onClick={clearChecked} className="mt-4 text-xs text-ink-soft underline">
          완료한 항목 지우기
        </button>
      )}
    </div>
  );
}
