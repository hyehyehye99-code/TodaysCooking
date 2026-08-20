import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { signOut } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { DeleteAccountButton } from "../delete-account-button";
import { ProfileForm } from "./profile-form";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("nickname, icon_emoji").eq("id", user.id).maybeSingle()
    : { data: null };

  const isGoogleAccount = user?.app_metadata?.provider === "google";

  return (
    <div className="pt-2">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[22px] font-bold">계정 관리</h1>
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

      <p className="mb-3 text-[13px] font-bold text-ink-soft">프로필</p>
      <GlassCard className="mb-6 bg-white p-4">
        <ProfileForm currentNickname={profile?.nickname ?? ""} currentIconEmoji={profile?.icon_emoji ?? null} />
      </GlassCard>

      {isGoogleAccount && (
        <>
          <p className="mb-3 text-[13px] font-bold text-ink-soft">연결된 계정</p>
          <GlassCard className="mb-6 bg-white p-4">
            <p className="text-sm font-semibold">구글로 가입했어요</p>
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
