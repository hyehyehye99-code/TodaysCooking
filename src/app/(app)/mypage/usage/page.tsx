import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { getAiQuota } from "@/lib/ai-quota";
import { GlassCard, ProgressBar, SectionLabel, SubPageHeader } from "@/components/ui";
import { LoginPrompt } from "@/components/LoginPrompt";
import { Mascot } from "@/components/Mascot";

const COUNTED = [
  { mascot: "reading-recipe", title: "링크로 레시피 등록", desc: "유튜브·인스타 링크를 AI가 정리해요" },
  { mascot: "chef-greeting", title: "AI 셰프와 대화", desc: "재료 추천, 요리 질문, 상황별 추천" },
] as const;

export default async function UsagePage() {
  const { user } = await getCurrentHousehold();
  if (!user) return <LoginPrompt kind="account" />;
  const quota = await getAiQuota(await createClient(), user);

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
    </div>
  );
}
