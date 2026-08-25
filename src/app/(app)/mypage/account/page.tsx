import { BackButton, GlassCard } from "@/components/ui";
import { signOut } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { DeleteAccountButton } from "../delete-account-button";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const PROVIDER_LABELS: Record<string, string> = {
    google: "구글로 가입했어요",
    apple: "Apple로 가입했어요",
    kakao: "카카오로 가입했어요",
  };
  const providerLabel = PROVIDER_LABELS[user?.app_metadata?.provider ?? ""];

  return (
    <div className="pt-2">
      <div className="mb-5 flex items-center gap-3">
        <BackButton href="/mypage" />
        <h1 className="text-[22px] font-bold">계정 관리</h1>
      </div>

      {providerLabel && (
        <>
          <p className="mb-3 text-[13px] font-bold text-ink-soft">연결된 계정</p>
          <GlassCard className="mb-6 bg-white p-4">
            <p className="text-sm font-semibold">{providerLabel}</p>
            {user?.email && <p className="mt-1 text-xs text-ink-soft">{user.email}</p>}
          </GlassCard>
        </>
      )}

      <GlassCard className="divide-y divide-border bg-white">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-semibold text-ink"
          >
            로그아웃
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
