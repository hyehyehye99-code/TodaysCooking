import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentHousehold, getMyHouseholds } from "@/lib/household";
import { acknowledgeHouseholdChange } from "@/lib/actions/household";
import { getDictionary } from "@/lib/i18n/server";
import { HOUSEHOLD_SETUP_FAILED_COOKIE } from "@/lib/constants";
import { signOut } from "@/lib/actions/auth";
import { TabBar } from "@/components/TabBar";
import { AppHeader } from "@/components/AppHeader";
import { PullToRefresh } from "@/components/PullToRefresh";
import { ActivityToaster } from "@/components/ActivityToaster";
import { Mascot } from "@/components/Mascot";
import { GuestMigrator } from "@/components/GuestMigrator";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [{ user, household, previousHouseholdMissing }, households, { dict }] = await Promise.all([
    getCurrentHousehold(),
    getMyHouseholds(),
    getDictionary(),
  ]);

  // Signed in but no household yet (first login, or they left their last one):
  // /auth/setup creates a default one and sends them back — there's no setup
  // screen to fill in anymore. If that ever fails, its cookie makes this show
  // a retry screen instead of bouncing between the two forever.
  if (user && !household) {
    const setupFailed = (await cookies()).get(HOUSEHOLD_SETUP_FAILED_COOKIE)?.value;
    if (!setupFailed) redirect("/auth/setup");

    return (
      <div className="mx-auto flex h-dvh w-full max-w-[420px] flex-col items-center justify-center px-7 text-center">
        <Mascot name="sleep" size={128} />
        <p className="mt-5 text-lg font-bold text-ink">{dict.guest.setupFailedTitle}</p>
        {/* A plain anchor, not <Link>: this targets a route handler, which
            must not be prefetched. */}
        <a href="/auth/setup" className="mt-6 rounded-xl bg-accent px-7 py-3.5 text-sm font-bold text-white">
          {dict.guest.setupRetry}
        </a>
        <form action={signOut} className="mt-3">
          <button type="submit" className="text-xs font-semibold text-ink-faint underline">
            {dict.mypage.signOut}
          </button>
        </form>
      </div>
    );
  }

  // No login required to use the app: a guest gets the same shell, with
  // recipes / shopping / fridge kept on this device (see lib/guest/store.ts)
  // and everything that needs an account gated inside its own page.
  const allHouseholds = households.map((h) => h.household);

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[680px] flex-col">
      {user && household && <ActivityToaster userId={user.id} householdId={household.id} />}
      {user && <GuestMigrator />}
      <PullToRefresh className="px-5 pt-[calc(max(env(safe-area-inset-top),24px)+16px)] pb-[max(env(safe-area-inset-bottom),40px)]">
        {household && previousHouseholdMissing && (
          <form
            action={acknowledgeHouseholdChange}
            className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-accent/20 bg-accent/8 px-4 py-3"
          >
            <input type="hidden" name="householdId" value={household.id} />
            <p className="text-xs font-semibold leading-snug text-accent-ink">
              이전에 있던 우리집을 더 이상 이용할 수 없어서 &lsquo;{household.name}&rsquo;(으)로 이동했어요.
            </p>
            <button
              type="submit"
              className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-accent-ink"
            >
              확인
            </button>
          </form>
        )}
        <AppHeader
          currentId={household?.id ?? "guest"}
          currentName={household?.name ?? dict.guest.homeName}
          households={allHouseholds}
        />
        {children}
      </PullToRefresh>
      <TabBar />
    </div>
  );
}
