"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const BASE_TABS = [
  {
    href: "/recipes",
    label: "레시피",
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
    href: "/bookmarks",
    label: "북마크",
    icon: <path d="M6 3.5h12a.5.5 0 0 1 .5.5v17l-6.5-4-6.5 4v-17a.5.5 0 0 1 .5-.5z" />,
  },
  {
    href: "/shopping",
    label: "장보기",
    icon: (
      <>
        <path d="M6.5 8h11l-.9 12.1a1 1 0 0 1-1 .9H8.4a1 1 0 0 1-1-.9L6.5 8z" />
        <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
      </>
    ),
  },
];

const ALL_TABS = [
  ...BASE_TABS,
  {
    href: "/cooking-photos",
    label: "요리사진",
    icon: (
      <>
        <path d="M4 8a2 2 0 0 1 2-2h2l1.2-1.6a1 1 0 0 1 .8-.4h4a1 1 0 0 1 .8.4L16 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
        <circle cx="12" cy="13" r="3.3" />
      </>
    ),
  },
];

export function TabBar({ basePath = "" }: { basePath?: string }) {
  const pathname = usePathname();
  const TABS = basePath ? BASE_TABS : ALL_TABS;

  const recipesRoot = `${basePath}/recipes`;
  const isRecipeSubpage = pathname.startsWith(`${recipesRoot}/`);
  const isSettings = !basePath && pathname.startsWith("/settings");

  if (isRecipeSubpage || isSettings) return null;

  return (
    <nav className="sticky bottom-0 z-10 flex border-t border-border bg-white px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-2">
      {TABS.map((tab) => {
        const href = `${basePath}${tab.href}`;
        const active = pathname.startsWith(href);
        return (
          <Link
            key={tab.href}
            href={href}
            className="flex flex-1 flex-col items-center gap-1 py-1"
            style={{ color: active ? "var(--color-accent)" : "var(--color-ink-faint)" }}
          >
            <svg
              viewBox="0 0 24 24"
              width="23"
              height="23"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {tab.icon}
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
