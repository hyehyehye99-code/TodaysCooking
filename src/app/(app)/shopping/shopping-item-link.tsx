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
      className="text-left"
    >
      <p className="text-sm font-semibold underline decoration-dotted underline-offset-2">
        {name}
      </p>
    </button>
  );
}
