"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Each icon is hand-drawn to a different bounding box within the shared
// 24x24 viewBox, so at a fixed container size they render at visibly
// different scales. scale/cx/cy normalize every icon to the same ~16-unit
// footprint centered at (12, 12); strokeWidth is scaled inversely so the
// rendered line weight stays uniform after the group transform.
const TABS = [
  {
    href: "/recipes",
    label: "요리책",
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
    href: "/fridge",
    label: "냉장고",
    cx: 12,
    cy: 12,
    scale: 0.8,
    icon: (
      <>
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M5 9h14" />
        <path d="M8 5v2" />
        <path d="M8 12v2" />
      </>
    ),
  },
  {
    href: "/shopping",
    label: "장보기",
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
    href: "/bookmarks",
    label: "보관함",
    cx: 12,
    cy: 12.25,
    scale: 0.91,
    icon: <path d="M6 3.5h12a.5.5 0 0 1 .5.5v17l-6.5-4-6.5 4v-17a.5.5 0 0 1 .5-.5z" />,
  },
  {
    href: "/mypage",
    label: "마이페이지",
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

  const isRecipeSubpage = pathname.startsWith("/recipes/");

  if (isRecipeSubpage) return null;

  return (
    <nav className="sticky bottom-0 z-10 flex border-t border-border bg-white px-2 pb-[max(env(safe-area-inset-bottom),30px)] pt-3">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-1 flex-col items-center gap-1 py-1"
            style={{ color: active ? "var(--color-accent)" : "var(--color-ink-faint)" }}
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
            <span className={`text-[10.5px] ${active ? "font-bold" : "font-medium"}`}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
