"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { getCoupangSearchLink } from "@/lib/actions/coupang";
import { toggleShoppingItem } from "@/lib/actions/shopping";

export function ShoppingItemLink({
  id,
  name,
  checked,
}: {
  id: string;
  name: string;
  checked: boolean;
}) {
  const [, startTransition] = useTransition();
  const router = useRouter();

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
          const formData = new FormData();
          formData.set("id", id);
          formData.set("nextChecked", (!checked).toString());
          const [{ url }] = await Promise.all([
            getCoupangSearchLink(name),
            toggleShoppingItem(formData),
          ]);
          if (win) win.location.href = url;
          router.refresh();
        });
      }}
      className="shrink-0 rounded-lg border border-accent bg-white px-2.5 py-1.5 text-[11px] font-bold text-accent-ink"
    >
      구매하기
    </button>
  );
}
