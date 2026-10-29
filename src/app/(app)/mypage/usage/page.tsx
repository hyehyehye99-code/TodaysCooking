import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { getTicketSummary, getUsageSettings, type TicketEvent } from "@/lib/tickets";
import { TicketCard } from "./ticket-card";
import { AutoUseSettings } from "./auto-use-settings";
import { InviteTicketRow } from "./invite-ticket-row";
import { getAiQuota } from "@/lib/ai-quota";
import { GlassCard, ProgressBar, SectionLabel, SubPageHeader } from "@/components/ui";
import { LoginPrompt } from "@/components/LoginPrompt";
import { Mascot } from "@/components/Mascot";

const COUNTED = [
  { mascot: "reading-recipe", title: "링크로 레시피 등록", desc: "유튜브·인스타 링크를 AI가 정리해요" },
  { mascot: "chef-greeting", title: "AI 셰프와 대화", desc: "재료 추천, 요리 질문, 상황별 추천" },
] as const;

const SOURCE_LABELS: Record<TicketEvent["source"], string> = {
  referral_inviter: "친구가 내 초대 링크로 가입",
  referral_invitee: "초대 링크로 가입 선물",
  admin: "우리집 레시피 선물",
};

function eventTitle(e: TicketEvent) {
  const kind = e.kind === "full" ? "전체" : "절반";
  return e.type === "used" ? `${kind} 초기화 티켓 사용` : SOURCE_LABELS[e.source];
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function UsagePage() {
  const { user, household } = await getCurrentHousehold();
  if (!user) return <LoginPrompt kind="account" />;
  const supabase = await createClient();
  const [quota, tickets, settings] = await Promise.all([
    getAiQuota(supabase, user),
    getTicketSummary(supabase, user.id),
    getUsageSettings(supabase, user.id),
  ]);

  return (
    <div className="pt-2">
      <SubPageHeader href="/mypage" title="사용량" />

      <GlassCard className="mb-6 bg-white p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-[15px] font-bold text-ink">주간 AI 사용량</p>
          {quota.unlimited ? (
            <span className="text-sm text-ink-soft">제한 없음</span>
          ) : (
            <span className="text-sm text-ink-soft">{quota.percent}% 사용</span>
          )}
        </div>
        {!quota.unlimited && (
          <>
            <div className="mt-3">
              <ProgressBar percent={quota.percent} colorClass={quota.percent >= 80 ? "bg-accent" : "bg-ink"} />
            </div>
            <p className="mt-3 text-[13px] text-ink-soft">
              <span className="font-semibold text-ink">최근 7일</span> 동안 쓴 만큼 계산돼요. 오래된 사용은 시간이 지나면 자동으로 빠져요.
            </p>
          </>
        )}
        {quota.bonusRemaining > 0 && (
          <p className="mt-4 rounded-2xl bg-accent/10 px-4 py-3 text-[13px] font-semibold text-accent-ink">
            프로모션 보너스 {quota.bonusRemaining}회가 남아 있어요. 보너스를 먼저 쓰고, 그동안 주간 사용량은 그대로예요.
          </p>
        )}
      </GlassCard>

      <div className="mb-6">
        <TicketCard counts={{ full: tickets.full, half: tickets.half }} usagePercent={quota.percent} />
      </div>

      {household && (
        <>
          <SectionLabel>초기화 티켓 획득하기</SectionLabel>
          <div className="mb-6">
            <InviteTicketRow householdName={household.name} inviteCode={household.invite_code} />
          </div>
        </>
      )}

      <SectionLabel>자동 사용 설정</SectionLabel>
      <div className="mb-6">
        <AutoUseSettings initial={settings} />
      </div>

      <SectionLabel>사용량에 포함되는 기능</SectionLabel>
      <GlassCard className="divide-y divide-border bg-white">
        {COUNTED.map((c) => (
          <div key={c.title} className="flex items-center gap-3 px-4 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface">
              <Mascot name={c.mascot} size={30} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">{c.title}</p>
              <p className="text-xs text-ink-soft">{c.desc}</p>
            </div>
          </div>
        ))}
      </GlassCard>

      {tickets.history.length > 0 && (
        <div className="mt-6">
          <SectionLabel>티켓 획득 이력</SectionLabel>
          <GlassCard className="divide-y divide-border bg-white">
            {tickets.history.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink">{eventTitle(e)}</p>
                  <p className="text-xs text-ink-soft">{formatDateTime(e.at)}</p>
                </div>
                <span className={`shrink-0 text-sm font-bold ${e.type === "used" ? "text-ink-soft" : "text-ink"}`}>
                  {e.type === "used" ? "−1" : "+1"}
                </span>
              </div>
            ))}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
