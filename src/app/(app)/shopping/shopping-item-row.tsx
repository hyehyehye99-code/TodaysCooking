"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleShoppingItem } from "@/lib/actions/shopping";
import { ShoppingItemLink } from "./shopping-item-link";
import type { ShoppingItem } from "@/lib/types";

export function ShoppingItemRow({ item }: { item: ShoppingItem }) {
  const [optimisticChecked, setOptimisticChecked] = useOptimistic(item.checked);
  const [, startToggleTransition] = useTransition();
  const router = useRouter();

  function toggleChecked() {
    const nextChecked = !optimisticChecked;
    startToggleTransition(async () => {
      setOptimisticChecked(nextChecked);
      const formData = new FormData();
      formData.set("id", item.id);
      formData.set("nextChecked", nextChecked.toString());
      await toggleShoppingItem(formData);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3 border-b border-border bg-white py-3.5">
      <button
        type="button"
        onClick={toggleChecked}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span
          className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border-[1.5px] transition-colors duration-150 ${
            optimisticChecked ? "border-positive bg-positive" : "border-border bg-surface"
          }`}
        >
          {optimisticChecked && (
            <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 7.5l3 3 6-7" />
            </svg>
          )}
        </span>

        <span
          className={`min-w-0 flex-1 truncate text-sm font-semibold transition-colors duration-150 ${
            optimisticChecked ? "text-ink-faint" : "text-ink"
          }`}
        >
          {item.name}
        </span>
      </button>

      <ShoppingItemLink id={item.id} name={item.name} checked={optimisticChecked} />
    </div>
  );
}
