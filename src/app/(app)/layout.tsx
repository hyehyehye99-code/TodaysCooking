import { redirect } from "next/navigation";
import { getCurrentHousehold, getMyHouseholds } from "@/lib/household";
import { TabBar } from "@/components/TabBar";
import { AppHeader } from "@/components/AppHeader";
import { GuestImportPrompt } from "@/components/GuestImportPrompt";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, household } = await getCurrentHousehold();

  if (!user) redirect("/login");
  if (!household) redirect("/onboarding");

  const households = await getMyHouseholds();

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[520px] flex-col">
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-[max(env(safe-area-inset-bottom),16px)]">
        <AppHeader
          currentId={household.id}
          currentName={household.name}
          households={households.map((h) => h.household)}
        />
        <GuestImportPrompt />
        {children}
      </div>
      <TabBar />
    </div>
  );
}
