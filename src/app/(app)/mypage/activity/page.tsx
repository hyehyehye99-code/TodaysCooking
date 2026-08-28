import Link from "next/link";
import { getCurrentHousehold } from "@/lib/household";
import { getHouseholdActivity } from "@/lib/actions/activity";
import { getDictionary } from "@/lib/i18n/server";
import { ActivityList } from "./activity-list";

export default async function ActivityPage() {
  const { household } = await getCurrentHousehold();
  const { dict } = await getDictionary();
  const activity = household ? await getHouseholdActivity(household.id) : [];

  return (
    <div className="pt-2">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[22px] font-bold">{dict.mypage.activityLog}</h1>
        <Link
          href="/mypage"
          aria-label={dict.common.close}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </Link>
      </div>

      <ActivityList activity={activity} />
    </div>
  );
}
