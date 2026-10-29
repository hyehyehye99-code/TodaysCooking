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
    href: "/assistant",
    labelKey: "assistant",
    cx: 12,
    cy: 12,
    scale: 0.9,
    icon: (
      <>
        <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
        <path d="M19 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
        <path d="M5.5 16l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5z" />
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
    // Floating pill: the nav keeps its full-width slot (pages size against
    // --app-tab-bar-height) but is transparent; the rounded glass bar sits inside it.
    <nav style={{ height: "var(--app-tab-bar-height)" }} className="sticky bottom-0 z-10 shrink-0 px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-1.5">
      <div className="flex h-full gap-0.5 rounded-full border border-black/5 bg-white/85 p-1 shadow-[0_6px_24px_rgba(25,31,40,0.12)] backdrop-blur-xl">
      {TABS.map((tab) => {
        // 메뉴판/타이머 live under the 마이페이지 tab now, so they keep it lit.
        const active =
          pathname.startsWith(tab.href) ||
          (tab.href === "/mypage" && (pathname.startsWith("/explore") || pathname.startsWith("/timer")));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            prefetch
            className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full outline-none transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent ${active ? "bg-accent/10 text-accent" : "text-ink-soft"}`}
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              className={`transition-transform duration-200 ${active ? "scale-110" : ""}`}
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
            <span className={`text-[11px] ${active ? "font-bold" : "font-medium"}`}>
              {dict.tabBar[tab.labelKey]}
            </span>
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
