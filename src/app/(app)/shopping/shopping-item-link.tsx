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
    <a
      href={`/redirect/coupang?name=${encodeURIComponent(name)}`}
      target="_blank"
      rel="noopener noreferrer"
      // A real anchor with target="_blank" is what actually breaks out to a
      // new window/system browser from an installed standalone PWA — a JS
      // window.open() call is a no-op there, which just left this stuck
      // navigating in place with nowhere to go.
      onClick={() => {
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
    </a>
  );
}
