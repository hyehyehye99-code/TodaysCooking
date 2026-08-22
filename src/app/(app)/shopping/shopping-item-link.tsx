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

  function toggleChecked() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);
      formData.set("nextChecked", (!checked).toString());
      await toggleShoppingItem(formData);
      router.refresh();
    });
  }

  return (
    <a
      href={`/redirect/coupang?name=${encodeURIComponent(name)}`}
      target="_blank"
      rel="noopener noreferrer"
      // A real anchor with target="_blank" is what reliably breaks out to a
      // new tab (regular browser) or the system browser (installed
      // standalone PWA on iOS/Android) — anything JS-driven (window.open(),
      // or resolving the link before navigating) has turned out to silently
      // do nothing in one context or another. /redirect/coupang itself
      // handles returning to /shopping if the app regains focus stuck on it.
      onClick={toggleChecked}
      className="shrink-0 rounded-lg bg-surface px-2.5 py-1.5 text-[11px] font-bold text-ink-soft"
    >
      구매하기
    </a>
  );
}
