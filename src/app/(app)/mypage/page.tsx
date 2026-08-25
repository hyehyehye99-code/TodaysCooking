import Link from "next/link";
import { getCurrentHousehold, getMyHouseholds } from "@/lib/household";
import { GlassCard, PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditButton } from "./profile-edit-button";
import { AddHouseholdSection } from "./add-household-section";
import { HouseholdList } from "./household-list";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { getUnreadNotificationCount } from "@/lib/actions/notifications";

const CONTACT_URL = "mailto:hyehyehye1919@gmail.com?subject=%EC%9A%B0%EB%A6%AC%EC%A7%91%20%EB%A9%94%EB%89%B4%ED%8C%90%20%EB%AC%B8%EC%9D%98";

type Member = { user_id: string; nickname: string; icon_emoji: string | null; role: string; joined_at: string };

export default async function MyPage() {
  const [{ user, household: current }, households, unreadCount] = await Promise.all([
    getCurrentHousehold(),
    getMyHouseholds(),
    getUnreadNotificationCount(),
  ]);
  const supabase = await createClient();

  const entries = await Promise.all(
    households.map(async ({ household, role }) => {
      const { data: members } = await supabase.rpc("get_household_members", {
        target_household_id: household.id,
      });
      return { household, role, members: (members as Member[] | null) ?? [] };
    })
  );

  const me = entries
    .find((e) => e.household.id === current?.id)
    ?.members.find((m) => m.user_id === user?.id);
  const myNickname = me?.nickname ?? "";
  const myIconEmoji = me?.icon_emoji ?? null;

  return (
    <div>
      <PageHeader
        title="마이페이지"
        right={
          <Link
            href="/mypage/notifications"
            aria-label="알림"
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink-soft"
          >
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4a5 5 0 0 0-5 5v3.2c0 .6-.2 1.2-.6 1.7L5 16h14l-1.4-2.1a2.8 2.8 0 0 1-.6-1.7V9a5 5 0 0 0-5-5z" />
              <path d="M9.5 19a2.5 2.5 0 0 0 5 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-warn" />
            )}
          </Link>
        }
      />

      <GlassCard className="mb-4 bg-white p-4">
        <ProfileEditButton nickname={myNickname} iconEmoji={myIconEmoji} />
      </GlassCard>

      <p className="mb-3 text-[13px] font-bold text-ink-soft">설정</p>
      <GlassCard className="mb-8 bg-white">
        <PushNotificationToggle />
      </GlassCard>

      <p className="mb-3 text-[13px] font-bold text-ink-soft">부엌 관리</p>
      <div className="mb-4">
        <HouseholdList entries={entries} currentId={current?.id ?? ""} myUserId={user?.id ?? ""} />
      </div>
      <div className="mb-8">
        <AddHouseholdSection />
      </div>

      <GlassCard className="mb-8 bg-white">
        <Link
          href="/mypage/account"
          className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-ink"
        >
          계정 관리
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>
      </GlassCard>

      <GlassCard className="bg-white">
        <div className="divide-y divide-border">
          <Link
            href="/mypage/about"
            className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-ink"
          >
            소개
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
          <a
            href={CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-ink"
          >
            문의하기
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </a>
          <Link
            href="/terms"
            className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-ink"
          >
            이용약관
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
          <Link
            href="/privacy"
            className="flex items-center justify-between px-4 py-4 text-sm font-semibold text-ink"
          >
            개인정보처리방침
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
