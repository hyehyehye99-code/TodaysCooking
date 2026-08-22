"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

const PULL_THRESHOLD = 64;
const MAX_PULL = 90;
const PULL_RESISTANCE = 0.5;

export function PullToRefresh({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  // This container is a single persistent DOM node shared across every
  // route in the (app) group — only `children` swaps on navigation, so
  // without this its scrollTop otherwise carries over from whatever tab
  // was scrolled last, instead of each screen starting at the top.
  useEffect(() => {
    containerRef.current?.scrollTo(0, 0);
  }, [pathname]);

  function handleTouchStart(e: React.TouchEvent) {
    const el = containerRef.current;
    if (pending || !el || el.scrollTop > 0) {
      startYRef.current = null;
      return;
    }
    startYRef.current = e.touches[0].clientY;
    setDragging(true);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (startYRef.current === null) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta <= 0) {
      setPull(0);
      return;
    }
    // Suppress the native scroll/rubber-band while we're driving our own
    // pull animation, so the two don't fight over the same gesture.
    e.preventDefault();
    setPull(Math.min(delta * PULL_RESISTANCE, MAX_PULL));
  }

  function handleTouchEnd() {
    if (startYRef.current === null) return;
    startYRef.current = null;
    setDragging(false);
    if (pull >= PULL_THRESHOLD) {
      startTransition(() => {
        router.refresh();
      });
    }
    setPull(0);
  }

  const shown = pending ? PULL_THRESHOLD : pull;

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center overflow-hidden"
        style={{ height: shown }}
      >
        <div className="flex items-end pb-2">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={pending ? "animate-spin" : ""}
            style={pending ? undefined : { transform: `rotate(${(shown / PULL_THRESHOLD) * 180}deg)` }}
          >
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <path d="M21 3v6h-6" />
          </svg>
        </div>
      </div>
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          // Only set a transform while actually mid-pull — leaving it
          // unset the rest of the time avoids the transform establishing
          // a containing block for descendant position:fixed elements
          // (modals, the sticky save bar), which would otherwise be
          // positioned/clipped relative to this scroll container instead
          // of the real viewport.
          transform: shown ? `translateY(${shown}px)` : undefined,
          transition: dragging ? "none" : "transform 200ms ease-out",
        }}
        className={`h-full overflow-y-auto overscroll-contain ${className ?? ""}`}
      >
        {children}
      </div>
    </div>
  );
}
