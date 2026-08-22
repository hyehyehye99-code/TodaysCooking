"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

// Matches TabBar's own rendered height (pt-3 + icon + gap + label + py-1) so
// a bar placed above the tab bar doesn't overlap it. TabBar's own bottom
// safe-area padding is added on top of this.
const TAB_BAR_CONTENT_HEIGHT = 62;

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
      className="fixed inset-x-0 z-40 mx-auto w-full max-w-[520px] border-t border-border bg-white px-5 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] shadow-[0_-6px_16px_-8px_rgba(0,0,0,0.15)]"
      style={
        aboveTabBar
          ? { bottom: `calc(max(env(safe-area-inset-bottom), 30px) + ${TAB_BAR_CONTENT_HEIGHT}px)` }
          : { bottom: 0 }
      }
    >
      {children}
    </div>,
    document.body
  );
}
