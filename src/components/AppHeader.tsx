"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { switchHousehold } from "@/lib/actions/household";

type HouseholdOption = { id: string; name: string };

export function AppHeader({
  currentName,
  otherHouseholds,
}: {
  currentName: string;
  otherHouseholds: HouseholdOption[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  if (pathname.startsWith("/mypage")) return null;

  if (otherHouseholds.length === 0) {
    return <h1 className="mb-4 text-[22px] font-bold tracking-tight">{currentName}</h1>;
  }

  return (
    <div className="relative mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[22px] font-bold tracking-tight"
      >
        {currentName}
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`mt-0.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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
          {otherHouseholds.map((h) => (
            <form key={h.id} action={switchHousehold}>
              <input type="hidden" name="householdId" value={h.id} />
              <button
                type="submit"
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink"
              >
                {h.name}
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
