"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminLogout } from "@/lib/actions/admin";

// Add new sections here as more admin tools get built — every page under
// (dashboard) shares this sidebar via the group layout.
const NAV_ITEMS = [
  {
    label: "홈",
    href: "/admin",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
      </svg>
    ),
  },
  {
    label: "크리에이터 관리",
    href: "/admin/creators",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
      </svg>
    ),
  },
  {
    label: "크리에이터 지원",
    href: "/admin/applications",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
        <path d="M3.5 7 12 13l8.5-6" />
      </svg>
    ),
  },
  {
    label: "엑셀로 가져오기",
    href: "/admin/import",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 15V4" />
        <path d="M8 8l4-4 4 4" />
        <path d="M4.5 14v4.5a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V14" />
      </svg>
    ),
  },
];

export function AdminSidebar({ pendingApplicationCount = 0 }: { pendingApplicationCount?: number }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-dvh w-60 shrink-0 flex-col border-r border-border bg-white px-4 py-6">
      <div className="mb-1 flex items-center gap-2 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-ink text-lg">
          🍳
        </span>
        <div>
          <p className="text-sm font-bold leading-none">우리집 레시피</p>
          <p className="mt-0.5 text-[11px] font-semibold leading-none text-ink-faint">Admin</p>
        </div>
      </div>

      <p className="mb-6 mt-5 px-2 text-xs leading-relaxed text-ink-soft">
        안녕하세요,
        <br />
        <span className="font-bold text-ink">관리자</span>님
      </p>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                active ? "bg-accent text-white" : "text-ink-soft hover:bg-surface"
              }`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.href === "/admin/applications" && pendingApplicationCount > 0 && (
                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold ${
                    active ? "bg-white text-accent-ink" : "bg-accent text-white"
                  }`}
                >
                  {pendingApplicationCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <form action={adminLogout}>
        <button
          type="submit"
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-ink-faint hover:bg-surface"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
            <path d="M16 16l4-4-4-4" />
            <path d="M20 12H9" />
          </svg>
          로그아웃
        </button>
      </form>
    </aside>
  );
}
