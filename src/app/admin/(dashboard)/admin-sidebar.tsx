"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminLogout } from "@/lib/actions/admin";

type BadgeKey = "applications" | "inquiries" | "aiReports";
type NavItem = { label: string; href: string; icon: React.ReactNode; badgeKey?: BadgeKey };
type NavGroup = { title?: string; items: NavItem[] };

const HOME_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
  </svg>
);
const INQUIRY_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5.5h16v11a1.5 1.5 0 0 1-1.5 1.5H9l-4 3v-3H4.5A1.5 1.5 0 0 1 3 16.5v-11z" />
    <path d="M7.5 9.5h9" />
    <path d="M7.5 13h6" />
  </svg>
);
const AI_REPORT_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3.5 3.5 8.5v7L12 20.5l8.5-5v-7L12 3.5z" />
    <path d="M12 8.5v4.5" />
    <path d="M12 16h.01" />
  </svg>
);
const USERS_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3" />
    <path d="M2.5 19c1.1-3.1 3.6-4.7 6.5-4.7s5.4 1.6 6.5 4.7" />
    <circle cx="17" cy="7.5" r="2.3" />
    <path d="M15.5 12.2c2.2.2 3.9 1.6 4.8 4.1" />
  </svg>
);
const SUBSCRIPTION_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="5" width="17" height="14" rx="2" />
    <path d="M3.5 10h17" />
    <path d="M7 14.5h4" />
  </svg>
);
const CREATOR_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
  </svg>
);
const APPLICATION_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <path d="M3.5 7 12 13l8.5-6" />
  </svg>
);
const RECIPE_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3v18" />
    <path d="M6 3c0 3-2 3-2 6s2 3 2 6" />
    <path d="M18 3v18" />
    <path d="M15 3v7a3 3 0 0 0 3 3" />
  </svg>
);
const IMPORT_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 15V4" />
    <path d="M8 8l4-4 4 4" />
    <path d="M4.5 14v4.5a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V14" />
  </svg>
);
const EXPENSE_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 8H8a4 4 0 0 0 0 8h8a4 4 0 0 1 0 4H4" />
  </svg>
);
const REVENUE_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17l5-5 4 4 8-8" />
    <path d="M15 8h5v5" />
  </svg>
);
const PROMO_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3.5 3.5 8v8l8.5 4.5 8.5-4.5V8L12 3.5z" />
    <path d="M9 12h6" />
    <path d="M9 15h4" />
  </svg>
);

// Add new groups/items here as more admin tools get built — every page
// under (dashboard) shares this sidebar via the group layout. `badgeKey`
// is optional and looks itself up in the `badges` prop passed from the
// layout.
const NAV_GROUPS: NavGroup[] = [
  { items: [{ label: "대시보드", href: "/admin", icon: HOME_ICON }] },
  {
    items: [
      { label: "문의 관리", href: "/admin/inquiries", icon: INQUIRY_ICON, badgeKey: "inquiries" },
      { label: "AI 기능 오류 사항 문의 관리", href: "/admin/ai-reports", icon: AI_REPORT_ICON, badgeKey: "aiReports" },
    ],
  },
  {
    title: "사용자 관리",
    items: [
      { label: "사용자 리스트", href: "/admin/users", icon: USERS_ICON },
      { label: "구독 사용자 리스트", href: "/admin/subscriptions", icon: SUBSCRIPTION_ICON },
      { label: "프로모션 코드 관리", href: "/admin/promotions", icon: PROMO_ICON },
    ],
  },
  {
    title: "크리에이터 관리",
    items: [
      { label: "크리에이터 신청 관리", href: "/admin/applications", icon: APPLICATION_ICON, badgeKey: "applications" },
      { label: "크리에이터 관리 리스트", href: "/admin/creators", icon: CREATOR_ICON },
      { label: "크리에이터 레시피 관리", href: "/admin/creator-recipes", icon: RECIPE_ICON },
      { label: "엑셀로 가져오기", href: "/admin/import", icon: IMPORT_ICON },
    ],
  },
  {
    title: "비용관리",
    items: [
      { label: "지출 관리", href: "/admin/expenses", icon: EXPENSE_ICON },
      { label: "수익 관리", href: "/admin/revenue", icon: REVENUE_ICON },
    ],
  },
];

type Badges = Partial<Record<BadgeKey, number>>;

export function AdminSidebar({ badges = {} }: { badges?: Badges }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-dvh w-64 shrink-0 flex-col border-r border-border bg-white px-4 py-6">
      <div className="mb-5 px-2">
        <p className="text-sm font-bold leading-none">우리집 레시피</p>
        <p className="mt-1 text-[11px] font-semibold leading-none text-ink-faint">Admin</p>
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {group.title && (
              <p className="mb-1 px-3 text-[11px] font-bold text-ink-faint">{group.title}</p>
            )}
            <div className="flex flex-col gap-1">
              {group.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href + "/"));
                const badgeCount = item.badgeKey ? badges[item.badgeKey] ?? 0 : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                      active ? "bg-accent text-white" : "text-ink-soft hover:bg-surface"
                    }`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="flex-1 leading-tight">{item.label}</span>
                    {badgeCount > 0 && (
                      <span
                        className={`flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-[11px] font-bold ${
                          active ? "bg-white text-accent-ink" : "bg-accent text-white"
                        }`}
                      >
                        {badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
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
