"use client";

// Guest-mode shopping list: the same screen as page.tsx, fed from this
// device's localStorage. The 구매하기 (Coupang) button works exactly as for
// a signed-in user — it never needed an account.

import { useMemo } from "react";
import { GlassCard, ProgressBar } from "@/components/ui";
import { ClearableInput } from "@/components/ClearableInput";
import { EmptyState } from "@/components/EmptyState";
import { Mascot } from "@/components/Mascot";
import { useDict } from "@/lib/i18n/client";
import { addShoppingItem, useGuestData } from "@/lib/guest/store";
import type { ShoppingItem } from "@/lib/types";
import { FinishShoppingBar } from "./finish-shopping-bar";
import { ShoppingItemRow } from "./shopping-item-row";
import { ShoppingBulkActions } from "./shopping-bulk-actions";

export function GuestShopping() {
  const dict = useDict();
  const { data, ready } = useGuestData();

  const items: ShoppingItem[] = useMemo(
    () =>
      // Newest first; the sort is stable, so items added together keep their order.
      [...data.shopping]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((s) => ({
          id: s.id,
          household_id: "guest",
          name: s.name,
          source_recipe_id: null,
          source_recipe_title: s.source_recipe_title,
          checked: s.checked,
          created_at: s.created_at,
        })),
    [data.shopping]
  );

  if (!ready) return null;

  const doneCount = items.filter((i) => i.checked).length;
  const percent = items.length ? (doneCount / items.length) * 100 : 0;
  const allChecked = items.length > 0 && doneCount === items.length;

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("name") as HTMLInputElement | null;
    addShoppingItem(input?.value ?? "");
    form.reset();
    // ClearableInput's clear button tracks input events, not the value.
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  }

  return (
    <div className="pb-[calc(11.5rem+env(safe-area-inset-bottom))]">
      <GlassCard className="mb-[18px] bg-white p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-2 text-[13px] font-bold">
            <Mascot name={allChecked ? "happy" : "shopping"} size={34} />
            {dict.shopping.currentTrip}
          </span>
          <span className="text-xs font-bold text-accent">
            {dict.shopping.doneCountTemplate.replace("{done}", String(doneCount)).replace("{total}", String(items.length))}
          </span>
        </div>
        <ProgressBar percent={percent} colorClass="bg-accent" />
      </GlassCard>

      <form onSubmit={handleAdd} className="mb-2 flex gap-2">
        <div className="min-w-0 flex-1">
          <ClearableInput
            name="name"
            placeholder={dict.shopping.addItemPlaceholder}
            className="w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <button type="submit" className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white">
          {dict.shopping.add}
        </button>
      </form>

      {items.length === 0 ? (
        <EmptyState mascot="shopping">{dict.shopping.emptyList}</EmptyState>
      ) : (
        <>
          <ShoppingBulkActions doneCount={doneCount} allChecked={allChecked} guest />
          <div className="mb-6 flex flex-col">
            {items.map((item) => (
              <ShoppingItemRow key={item.id} item={item} guest />
            ))}
          </div>
        </>
      )}

      <FinishShoppingBar doneCount={doneCount} guest />
    </div>
  );
}
