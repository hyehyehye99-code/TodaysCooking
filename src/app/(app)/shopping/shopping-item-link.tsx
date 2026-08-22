"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
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
        // Opens our own branded interstitial (logo + "이동중이에요~" + the
        // Coupang Partners disclosure) which itself resolves the affiliate
        // link and redirects — keeps this click a plain synchronous
        // window.open so it's never blocked as a popup.
        window.open(`/redirect/coupang?name=${encodeURIComponent(name)}`, "_blank");
        startTransition(async () => {
          const formData = new FormData();
          formData.set("id", id);
          formData.set("nextChecked", (!checked).toString());
          await toggleShoppingItem(formData);
          router.refresh();
        });
      }}
      className="shrink-0 rounded-lg bg-accent/10 px-2.5 py-1.5 text-[11px] font-bold text-accent-ink"
    >
      구매하기
    </button>
  );
}
