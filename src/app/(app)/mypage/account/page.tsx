import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { signOut } from "@/lib/actions/auth";
import { DeleteAccountButton } from "../delete-account-button";

export default function AccountPage() {
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
