"use client";

import { useEffect, useState } from "react";

const HOLD_MS = 700;
const FADE_MS = 350;

// Mounted once in the root layout, so it only ever shows on a real
// full-page load (first visit, hard refresh, PWA cold start) — App
// Router keeps the root layout mounted across client-side navigations,
// so switching tabs never re-triggers this.
export function Splash() {
  const [mounted, setMounted] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), HOLD_MS);
    const removeTimer = setTimeout(() => setMounted(false), HOLD_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white transition-opacity ease-out"
      style={{
        transitionDuration: `${FADE_MS}ms`,
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <div
        className="flex flex-col items-center gap-3 transition-transform ease-out"
        style={{
          transitionDuration: `${HOLD_MS + FADE_MS}ms`,
          transform: fading ? "scale(1.08)" : "scale(1)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.svg" alt="" width={112} height={112} />
        <p className="text-sm font-bold tracking-wide text-accent">우리집 메뉴판</p>
      </div>
    </div>
  );
}
