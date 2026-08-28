"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { switchHousehold } from "@/lib/actions/household";
import { useDict } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n/dictionaries/ko";

type HouseholdOption = { id: string; name: string };

const TAB_TITLE_KEYS: Record<string, keyof Dictionary["tabBar"]> = {
  "/recipes": "recipes",
  "/fridge": "fridge",
  "/explore": "explore",
  "/shopping": "shopping",
};

export function AppHeader({
  currentId,
  currentName,
  households,
}: {
  currentId: string;
  currentName: string;
  households: HouseholdOption[];
}) {
  const dict = useDict();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  if (pathname.startsWith("/mypage") || pathname.startsWith("/recipes/") || pathname.startsWith("/explore/"))
    return null;

  const isRecipesTab = pathname === "/recipes";
  const isExploreTab = pathname === "/explore";
  const tabTitleKey = TAB_TITLE_KEYS[pathname];
  const tabTitle = tabTitleKey ? dict.tabBar[tabTitleKey] : "";

  const nameClassName = isRecipesTab
    ? "flex items-center gap-1.5 whitespace-nowrap text-[26px] font-bold tracking-tight"
    : "flex items-center gap-1 whitespace-nowrap text-sm font-bold text-ink-soft";

  const householdSwitcher =
    households.length <= 1 ? (
      <p className={nameClassName}>{currentName}</p>
    ) : (
      <div className="relative inline-block">
        <button type="button" onClick={() => setOpen((v) => !v)} className={nameClassName}>
          {currentName}
          <svg
            viewBox="0 0 24 24"
            width={isRecipesTab ? 20 : 14}
            height={isRecipesTab ? 20 : 14}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}

        <div
          className={`absolute left-0 top-full z-20 mt-2 origin-top overflow-hidden rounded-2xl border border-border bg-white shadow-lg transition-all duration-200 ${
            open
              ? "max-h-60 translate-y-0 opacity-100"
              : "pointer-events-none max-h-0 -translate-y-2 opacity-0"
          }`}
        >
          <div className="flex min-w-[160px] flex-col gap-0.5 p-2">
            {households.map((h) => {
              const active = h.id === currentId;
              if (active) {
                return (
                  <div
                    key={h.id}
                    className="flex w-full items-center justify-between whitespace-nowrap rounded-xl bg-accent/8 px-3 py-2.5 text-left text-sm font-bold text-accent-ink"
                  >
                    {h.name}
                    <span className="ml-1.5 text-xs font-normal text-accent">{dict.components.inUse}</span>
                  </div>
                );
              }
              return (
                <form key={h.id} action={switchHousehold}>
                  <input type="hidden" name="householdId" value={h.id} />
                  <button
                    type="submit"
                    onClick={() => setOpen(false)}
                    className="w-full whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink"
                  >
                    {h.name}
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      </div>
    );

  if (isRecipesTab) {
    return (
      <div className="mb-3 flex items-baseline justify-between gap-3">
        {householdSwitcher}
        <Link href="/recipes/new" className="shrink-0 text-sm font-bold text-accent">
          {dict.components.newRecipeLink}
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-3">
      {!isExploreTab && <div className="mb-1">{householdSwitcher}</div>}

      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-[26px] font-bold tracking-tight">{tabTitle}</h1>
      </div>
    </div>
  );
}
