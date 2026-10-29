import { getCurrentHousehold } from "@/lib/household";
import { SubPageHeader } from "@/components/ui";
import { LoginPrompt } from "@/components/LoginPrompt";
import { getHouseholdActivity } from "@/lib/actions/activity";
import { getDictionary } from "@/lib/i18n/server";
import { ActivityList } from "./activity-list";

export default async function ActivityPage() {
  const { user, household } = await getCurrentHousehold();
  if (!user) return <LoginPrompt kind="account" />;
  const { dict } = await getDictionary();
  const activity = household ? await getHouseholdActivity(household.id) : [];

  return (
    <div className="pt-2">
      <SubPageHeader href="/mypage" title={dict.mypage.activityLog} />

      <ActivityList activity={activity} />
    </div>
  );
}
