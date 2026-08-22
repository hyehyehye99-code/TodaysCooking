import Link from "next/link";
import { getMyNotifications } from "@/lib/actions/notifications";
import { NotificationsList } from "./notifications-list";

export default async function NotificationsPage() {
  const notifications = await getMyNotifications();

  return (
    <div className="pt-2">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[22px] font-bold">알림</h1>
        <Link
          href="/mypage"
          aria-label="닫기"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </Link>
      </div>

      <NotificationsList notifications={notifications} />
    </div>
  );
}
