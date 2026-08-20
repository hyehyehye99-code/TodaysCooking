"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { switchHousehold } from "@/lib/actions/household";

type HouseholdOption = { id: string; name: string };

const TAB_TITLES: Record<string, string> = {
  "/recipes": "메뉴판",
  "/fridge": "냉장고",
  "/bookmarks": "보관함",
  "/shopping": "장보기",
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
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  if (pathname.startsWith("/mypage") || pathname.startsWith("/recipes/")) return null;

  const tabTitle = TAB_TITLES[pathname] ?? "";
  const showNewRecipeButton = pathname === "/recipes";
  const showAddBookmarkButton = pathname === "/bookmarks";

  return (
    <div className="mb-3">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="flex min-w-0 items-baseline gap-1.5 text-[26px] font-bold tracking-tight">
          {households.length <= 1 ? (
            <span className="shrink-0 font-medium text-ink-soft">{currentName}</span>
          ) : (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-baseline gap-1 whitespace-nowrap font-medium text-ink-soft"
              >
                {currentName}
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`shrink-0 self-center transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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
                          <span className="ml-1.5 text-xs font-normal text-accent">사용 중</span>
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
          )}
          <span className="truncate">{tabTitle}</span>
        </h1>
        {showNewRecipeButton && (
          <Link href="/recipes/new" className="shrink-0 text-sm font-bold text-accent">
            + 새 메뉴
          </Link>
        )}
        {showAddBookmarkButton && (
          <Link href="/bookmarks?add=1" className="shrink-0 text-sm font-bold text-accent">
            + 링크 추가하기
          </Link>
        )}
      </div>
    </div>
  );
}
