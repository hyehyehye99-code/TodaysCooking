"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleShoppingItem } from "@/lib/actions/shopping";
import { getCoupangSearchLink } from "@/lib/actions/coupang";
import { Modal } from "@/components/Modal";

function subscribeNever() {
  return () => {};
}

function getStandaloneSnapshot() {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function getStandaloneServerSnapshot() {
  return false;
}

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
  const [redirecting, setRedirecting] = useState(false);
  // An installed iOS/Android home-screen PWA has no real "new tab" — a
  // same-origin navigation (like our /redirect/coupang page) just replaces
  // the app's single webview in place. The subsequent cross-origin redirect
  // from that page does correctly hand off to Safari, but the app's own
  // webview is left stranded showing that interstitial forever. Only a
  // direct top-level navigation straight to the external URL (no same-origin
  // hop first) gets handed off cleanly without disturbing our page, so
  // standalone mode gets its own in-place flow instead of a new tab.
  const standalone = useSyncExternalStore(
    subscribeNever,
    getStandaloneSnapshot,
    getStandaloneServerSnapshot
  );

  function toggleChecked() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);
      formData.set("nextChecked", (!checked).toString());
      await toggleShoppingItem(formData);
      router.refresh();
    });
  }

  if (standalone) {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            toggleChecked();
            setRedirecting(true);
            getCoupangSearchLink(name).then(({ url }) => {
              window.location.href = url;
            });
          }}
          className="shrink-0 rounded-lg bg-surface px-2.5 py-1.5 text-[11px] font-bold text-ink-soft"
        >
          구매하기
        </button>

        <Modal open={redirecting} onClose={() => setRedirecting(false)} variant="center">
          <div className="mx-auto flex w-full max-w-[300px] flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.svg" alt="" width={56} height={56} />
            <p className="text-sm font-bold text-ink">쿠팡으로 이동중이에요~</p>
            <p className="rounded-xl bg-surface px-4 py-3 text-[11px] leading-relaxed text-ink-soft">
              쿠팡파트너스 활동의 일환으로 &quot;구매하기&quot; 버튼을 클릭하면 이에 따른 일정 금액의
              수수료를 제공받습니다.
            </p>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
          </div>
        </Modal>
      </>
    );
  }

  return (
    <a
      href={`/redirect/coupang?name=${encodeURIComponent(name)}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={toggleChecked}
      className="shrink-0 rounded-lg bg-surface px-2.5 py-1.5 text-[11px] font-bold text-ink-soft"
    >
      구매하기
    </a>
  );
}
