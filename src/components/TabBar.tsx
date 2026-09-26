"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDict } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n/dictionaries/ko";
import { isExploreDetailPath } from "@/lib/explorePath";

// Each icon is hand-drawn to a different bounding box within the shared
// 24x24 viewBox, so at a fixed container size they render at visibly
// different scales. scale/cx/cy normalize every icon to the same ~16-unit
// footprint centered at (12, 12); strokeWidth is scaled inversely so the
// rendered line weight stays uniform after the group transform.
const TABS: {
  href: string;
  labelKey: keyof Dictionary["tabBar"];
  cx: number;
  cy: number;
  scale: number;
  icon: React.ReactNode;
}[] = [
  {
    href: "/recipes",
    labelKey: "recipes",
    cx: 12,
    cy: 12,
    scale: 1,
    icon: (
      <>
        <path d="M4 5.5c2.2-1 5.2-1 8 0 2.8-1 5.8-1 8 0v13c-2.2-1-5.2-1-8 0-2.8-1-5.8-1-8 0z" />
        <path d="M12 5.5v13" />
      </>
    ),
  },
  {
    href: "/explore",
    labelKey: "explore",
    cx: 12,
    cy: 12,
    scale: 0.85,
    icon: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8.5h8" />
        <path d="M8 12.5h8" />
        <path d="M8 16.5h5" />
      </>
    ),
  },
  {
    href: "/shopping",
    labelKey: "shopping",
    cx: 12.25,
    cy: 12.15,
    scale: 0.82,
    icon: (
      <>
        <circle cx="9" cy="20.5" r="1.3" />
        <circle cx="18" cy="20.5" r="1.3" />
        <path d="M2.5 2.5h3l2.5 12.5a1.8 1.8 0 0 0 1.8 1.5h8.4a1.8 1.8 0 0 0 1.8-1.5L22 6.5H6" />
      </>
    ),
  },
  {
    href: "/timer",
    labelKey: "timer",
    cx: 12,
    cy: 12.5,
    scale: 0.85,
    icon: (
      <>
        <path d="M10 2h4" />
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l3 2" />
      </>
    ),
  },
  {
    href: "/mypage",
    labelKey: "mypage",
    cx: 12,
    cy: 12.25,
    scale: 1.03,
    icon: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
      </>
    ),
  },
];

export function TabBar() {
  const pathname = usePathname();
  const dict = useDict();

  const isSubpage =
    pathname.startsWith("/recipes/") ||
    pathname.startsWith("/mypage/") ||
    pathname.startsWith("/timer/") ||
    (pathname.startsWith("/explore/") && !isExploreDetailPath(pathname));

  if (isSubpage) return null;

  return (
    <nav style={{ height: "var(--app-tab-bar-height)" }} className="sticky bottom-0 z-10 flex shrink-0 gap-1 border-t border-border bg-white/95 px-3 pb-[max(env(safe-area-inset-bottom),16px)] pt-2.5 backdrop-blur-xl">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            prefetch
            className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${active ? "text-accent" : "text-ink-soft"}`}
          >
            <svg
              viewBox="0 0 24 24"
              width="23"
              height="23"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <g
                strokeWidth={1.8 / tab.scale}
                transform={`translate(12 12) scale(${tab.scale}) translate(${-tab.cx} ${-tab.cy})`}
              >
                {tab.icon}
              </g>
            </svg>
            <span className={`text-[12px] ${active ? "font-bold" : "font-medium"}`}>
              {dict.tabBar[tab.labelKey]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
