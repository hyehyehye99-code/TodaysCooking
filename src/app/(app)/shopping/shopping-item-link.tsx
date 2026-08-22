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
      aria-label="쿠팡에서 구매하기"
      title="쿠팡에서 구매하기"
      // A real anchor with target="_blank" is what actually breaks out to a
      // new window/system browser from an installed standalone PWA — a JS
      // window.open() call is a no-op there.
      onClick={() => {
        startTransition(async () => {
          const formData = new FormData();
          formData.set("id", id);
          formData.set("nextChecked", (!checked).toString());
          await toggleShoppingItem(formData);
          router.refresh();
        });
      }}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <path d="M15 3h6v6" />
        <path d="M10 14L21 3" />
      </svg>
    </a>
  );
}
