import { redirect } from "next/navigation";
import { getCurrentHousehold, getMyHouseholds } from "@/lib/household";
import { acknowledgeHouseholdChange } from "@/lib/actions/household";
import { TabBar } from "@/components/TabBar";
import { AppHeader } from "@/components/AppHeader";
import { PullToRefresh } from "@/components/PullToRefresh";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [{ user, household, previousHouseholdMissing }, households] = await Promise.all([
    getCurrentHousehold(),
    getMyHouseholds(),
  ]);

  if (!user) redirect("/login");
  if (!household) redirect("/onboarding");

  const allHouseholds = households.map((h) => h.household);

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[680px] flex-col">
      <PullToRefresh className="px-5 pt-[calc(max(env(safe-area-inset-top),24px)+16px)] pb-[max(env(safe-area-inset-bottom),40px)]">
        {previousHouseholdMissing && (
          <form
            action={acknowledgeHouseholdChange}
            className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-accent/20 bg-accent/8 px-4 py-3"
          >
            <input type="hidden" name="householdId" value={household.id} />
            <p className="text-xs font-semibold leading-snug text-accent-ink">
              이전에 있던 부엌을 더 이상 이용할 수 없어서 &lsquo;{household.name}&rsquo;(으)로 이동했어요.
            </p>
            <button
              type="submit"
              className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-accent-ink"
            >
              확인
            </button>
          </form>
        )}
        <AppHeader currentId={household.id} currentName={household.name} households={allHouseholds} />
        {children}
      </PullToRefresh>
      <TabBar />
    </div>
  );
}
