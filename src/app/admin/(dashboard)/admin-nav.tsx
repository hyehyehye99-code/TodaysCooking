"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminLogout } from "@/lib/actions/admin";

// Add new sections here as more admin tools get built — every page under
// (dashboard) shares this nav via the group layout.
const NAV_ITEMS = [{ label: "크리에이터 관리", href: "/admin/creators" }];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between border-b border-border pb-3">
      <div className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
                active ? "bg-accent text-white" : "text-ink-soft hover:bg-surface"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <form action={adminLogout}>
        <button type="submit" className="text-xs font-semibold text-ink-faint underline">
          로그아웃
        </button>
      </form>
    </div>
  );
}
