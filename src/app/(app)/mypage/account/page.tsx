import { BackButton, GlassCard } from "@/components/ui";
import { signOut } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";
import { DeleteAccountButton } from "../delete-account-button";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { dict } = await getDictionary();

  const PROVIDER_LABELS: Record<string, string> = {
    google: dict.mypage.providerGoogle,
    apple: dict.mypage.providerApple,
    kakao: dict.mypage.providerKakao,
  };
  const providerLabel = PROVIDER_LABELS[user?.app_metadata?.provider ?? ""];

  return (
    <div className="pt-2">
      <div className="mb-5 flex items-center gap-3">
        <BackButton href="/mypage" />
        <h1 className="text-[22px] font-bold">{dict.mypage.accountManagement}</h1>
      </div>

      {providerLabel && (
        <>
          <p className="mb-3 text-[13px] font-bold text-ink-soft">{dict.mypage.connectedAccount}</p>
          <GlassCard className="mb-6 bg-white p-4">
            <p className="text-sm font-semibold">{providerLabel}</p>
            {user?.email && <p className="mt-1 text-xs text-ink-soft">{user.email}</p>}
          </GlassCard>
        </>
      )}

      <p className="mb-3 text-[13px] font-bold text-ink-soft">{dict.components.notifications}</p>
      <GlassCard className="mb-6 bg-white">
        <PushNotificationToggle />
      </GlassCard>

      <GlassCard className="divide-y divide-border bg-white">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-semibold text-ink"
          >
            {dict.mypage.signOut}
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </form>
        <DeleteAccountButton />
      </GlassCard>
    </div>
  );
}
