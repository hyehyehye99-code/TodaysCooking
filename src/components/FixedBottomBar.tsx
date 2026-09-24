"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

function subscribeNever() {
  return () => {};
}

function getMountedSnapshot() {
  return true;
}

function getMountedServerSnapshot() {
  return false;
}

// Rendered via a portal straight into document.body so it's a true
// viewport-fixed element, independent of any ancestor's scroll container or
// transform (PullToRefresh applies a translateY to the scroll area, which
// would otherwise turn position:fixed into something relative to that
// scrolling box instead of the viewport).
export function FixedBottomBar({
  children,
  aboveTabBar = false,
}: {
  children: React.ReactNode;
  aboveTabBar?: boolean;
}) {
  const mounted = useSyncExternalStore(subscribeNever, getMountedSnapshot, getMountedServerSnapshot);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-x-0 z-40 mx-auto w-full max-w-[680px] border-t border-border bg-white/95 px-5 pt-3 backdrop-blur-xl ${aboveTabBar ? "pb-3" : "pb-[max(env(safe-area-inset-bottom),12px)]"}`}
      style={
        aboveTabBar
          ? { bottom: "var(--app-tab-bar-height)" }
          : { bottom: 0 }
      }
    >
      {children}
    </div>,
    document.body
  );
}
