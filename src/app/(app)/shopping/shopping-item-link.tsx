"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { toggleShoppingItem } from "@/lib/actions/shopping";
import { useDict } from "@/lib/i18n/client";

export function ShoppingItemLink({
  id,
  name,
  checked,
}: {
  id: string;
  name: string;
  checked: boolean;
}) {
  const dict = useDict();
  const [, startTransition] = useTransition();
  const router = useRouter();

  // No router.refresh() here on purpose: toggleShoppingItem already calls
  // revalidatePath("/shopping") server-side, and this click also fires
  // router.push(/redirect/coupang) right after — a refresh() landing while
  // that push is still resolving raced the two Router Cache updates against
  // each other, which is what made this button need several taps to work.
  function toggleChecked() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);
      formData.set("nextChecked", (!checked).toString());
      await toggleShoppingItem(formData);
    });
  }

  // In the native app, target="_blank" hands off to the system browser
  // instead of Capacitor's in-app browser, so /redirect/coupang is reached
  // via a normal same-webview navigation here — the page itself branches on
  // Capacitor.isNativePlatform() to open the result via @capacitor/browser
  // and bounce back, instead of window.location.replace()'ing to it.
  if (Capacitor.isNativePlatform()) {
    return (
      <button
        type="button"
        onClick={() => {
          toggleChecked();
          router.push(`/redirect/coupang?name=${encodeURIComponent(name)}`);
        }}
        className="flex shrink-0 items-center gap-1 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-white"
      >
        <CartIcon />
        {dict.shopping.buyButton}
      </button>
    );
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
      className="flex shrink-0 items-center gap-1 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-white"
    >
      <CartIcon />
      {dict.shopping.buyButton}
    </a>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <path d="M2.5 3.5h2l2.4 12.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.3l1.3-7.2H6.1" />
    </svg>
  );
}
