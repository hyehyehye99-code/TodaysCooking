"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
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

  // In the native app, target="_blank" hands off to the system browser
  // instead of Capacitor's in-app browser, so /redirect/coupang is reached
  // via a normal same-webview navigation here — the page itself branches on
  // Capacitor.isNativePlatform() to open the result via @capacitor/browser
  // and bounce back, instead of window.location.replace()'ing to it.
  if (Capacitor.isNativePlatform()) {
    return (
      <button
        type="button"
        // The row this sits in arms a swipe-to-delete drag on pointerdown
        // anywhere inside it (there's no non-interactive area to start a
        // swipe from otherwise) and only decides "tap vs. drag" once the
        // pointer has moved a few px — on a small edge button like this one,
        // ordinary touch jitter during a tap crosses that threshold often
        // enough that the resulting pointer capture swallows the click.
        // data-swipe-ignore tells the row to never arm for a press that
        // starts here, so this button always gets a clean click.
        data-swipe-ignore
        onClick={() => {
          toggleChecked();
          router.push(`/redirect/coupang?name=${encodeURIComponent(name)}`);
        }}
        className="shrink-0 rounded-lg bg-surface px-2.5 py-1.5 text-[11px] font-bold text-ink-soft"
      >
        구매하기
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
      data-swipe-ignore
      className="shrink-0 rounded-lg bg-surface px-2.5 py-1.5 text-[11px] font-bold text-ink-soft"
    >
      구매하기
    </a>
  );
}
