"use client";

import { useState } from "react";
import { AdminSidebar } from "./admin-sidebar";

type Badges = Partial<Record<"applications" | "inquiries" | "aiReports", number>>;

// The sidebar (admin-sidebar.tsx) assumes it's always visible, which is fine
// on desktop but leaves nothing for a real phone width — this wraps it in a
// slide-in drawer below the md breakpoint (a backdrop + hamburger toggle in
// a mobile-only top bar) while leaving the desktop layout untouched above it.
export function AdminShell({ badges, children }: { badges: Badges; children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      {navOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 md:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AdminSidebar badges={badges} onNavigate={() => setNavOpen(false)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-white px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="메뉴 열기"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-soft hover:bg-surface"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          </button>
          <p className="text-sm font-bold">우리집 레시피 Admin</p>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-[1040px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
