"use client";

import { useTransition } from "react";
import { getCoupangSearchLink } from "@/lib/actions/coupang";

export function ShoppingItemLink({ name }: { name: string }) {
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        // Open the tab synchronously on the click itself and point it at the
        // real URL once we have it — waiting for the fetch before calling
        // window.open loses the user-gesture context and gets blocked as a
        // popup in most browsers.
        const win = window.open("", "_blank");
        startTransition(async () => {
          const { url } = await getCoupangSearchLink(name);
          if (win) win.location.href = url;
        });
      }}
      className="shrink-0 rounded-lg bg-accent/10 px-2.5 py-1.5 text-[11px] font-bold text-accent-ink"
    >
      구매하기
    </button>
  );
}
