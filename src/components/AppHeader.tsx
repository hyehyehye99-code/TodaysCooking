"use client";

import { useState } from "react";
import Link from "next/link";
import { switchHousehold } from "@/lib/actions/household";

type HouseholdOption = { id: string; name: string };

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

  return (
    <div className="relative mb-5">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 rounded-full bg-accent/10 py-1.5 pl-3 pr-2 text-xs font-bold text-accent-ink"
        >
          {currentName}
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}

      <div
        className={`absolute left-0 right-0 top-full z-20 mt-2 origin-top overflow-hidden rounded-2xl border border-border bg-white shadow-lg transition-all duration-200 ${
          open
            ? "max-h-96 translate-y-0 opacity-100"
            : "pointer-events-none max-h-0 -translate-y-2 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-0.5 p-2">
          {households.map((h) => {
            const active = h.id === currentId;
            if (active) {
              return (
                <Link
                  key={h.id}
                  href={`/mypage/${h.id}`}
                  onClick={() => setOpen(false)}
                  className="w-full rounded-xl bg-accent/8 px-3 py-2.5 text-left text-sm font-semibold text-accent-ink"
                >
                  {h.name}
                  <span className="ml-1.5 text-xs font-normal text-accent">· 사용 중</span>
                </Link>
              );
            }
            return (
              <form key={h.id} action={switchHousehold}>
                <input type="hidden" name="householdId" value={h.id} />
                <button
                  type="submit"
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink"
                >
                  {h.name}
                </button>
              </form>
            );
          })}
          <Link
            href="/mypage"
            onClick={() => setOpen(false)}
            className="mt-1 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-ink-soft"
          >
            요리책 관리 (만들기 · 참여) →
          </Link>
        </div>
      </div>
    </div>
  );
}
