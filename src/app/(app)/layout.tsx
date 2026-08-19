import { redirect } from "next/navigation";
import { getCurrentHousehold, getMyHouseholds } from "@/lib/household";
import { TabBar } from "@/components/TabBar";
import { AppHeader } from "@/components/AppHeader";
import { PullToRefresh } from "@/components/PullToRefresh";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [{ user, household }, households] = await Promise.all([
    getCurrentHousehold(),
    getMyHouseholds(),
  ]);

  if (!user) redirect("/login");
  if (!household) redirect("/onboarding");

  const allHouseholds = households.map((h) => h.household);

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[520px] flex-col">
      <PullToRefresh className="px-5 pt-6 pb-[max(env(safe-area-inset-bottom),40px)]">
        <AppHeader currentId={household.id} currentName={household.name} households={allHouseholds} />
        {children}
      </PullToRefresh>
      <TabBar />
    </div>
  );
}
