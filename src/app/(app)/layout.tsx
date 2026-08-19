import { redirect } from "next/navigation";
import { getCurrentHousehold } from "@/lib/household";
import { TabBar } from "@/components/TabBar";
import { AppHeader } from "@/components/AppHeader";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, household } = await getCurrentHousehold();

  if (!user) redirect("/login");
  if (!household) redirect("/onboarding");

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[520px] flex-col">
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-[max(env(safe-area-inset-bottom),16px)]">
        <AppHeader currentName={household.name} />
        {children}
      </div>
      <TabBar />
    </div>
  );
}
