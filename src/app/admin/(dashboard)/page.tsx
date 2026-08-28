import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

function formatWon(amount: number) {
  return `${Math.round(amount).toLocaleString("ko-KR")}원`;
}

export default async function AdminHomePage() {
  const supabase = createAdminClient();
  const now = new Date();
  const weekAgoIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStartIso = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { data: usersData },
    { count: activeSubscribers },
    { data: monthEvents },
    { count: weekAiGenerations },
    { data: monthExpenses },
    { count: pendingApplications },
    { count: openInquiries },
    { count: aiReports },
  ] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase
      .from("household_subscriptions")
      .select("household_id", { count: "exact", head: true })
      .eq("active", true)
      .or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`),
    supabase.from("subscription_events").select("price, currency").gte("occurred_at", monthStartIso),
    supabase.from("ai_recipe_generations").select("id", { count: "exact", head: true }).gte("created_at", weekAgoIso),
    supabase.from("expenses").select("amount").gte("spent_at", monthStartIso.slice(0, 10)),
    supabase.from("creator_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("ai_recipe_reports").select("id", { count: "exact", head: true }),
  ]);

  const totalUsers = usersData.users.length;
  const newUsersThisWeek = usersData.users.filter((u) => new Date(u.created_at) >= new Date(weekAgoIso)).length;

  const monthRevenueByCurrency = ((monthEvents as { price: number | null; currency: string | null }[] | null) ?? []).reduce<
    Record<string, number>
  >((acc, e) => {
    if (typeof e.price !== "number") return acc;
    const currency = e.currency ?? "KRW";
    acc[currency] = (acc[currency] ?? 0) + e.price;
    return acc;
  }, {});
  const monthRevenueKrw = monthRevenueByCurrency.KRW ?? 0;
  const otherCurrencies = Object.entries(monthRevenueByCurrency).filter(([c]) => c !== "KRW");

  const monthExpenseTotal = ((monthExpenses as { amount: number }[] | null) ?? []).reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">대시보드</h1>
      <p className="mb-6 text-sm text-ink-soft">우리집 레시피 관리자 대시보드예요.</p>

      <p className="mb-2 text-xs font-bold text-ink-faint">핵심 지표</p>
      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs font-semibold text-ink-soft">전체 유저</p>
          <p className="mt-2 text-2xl font-bold">{totalUsers}명</p>
          <p className="mt-1 text-[11px] font-semibold text-accent-ink">최근 7일 신규 {newUsersThisWeek}명</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs font-semibold text-ink-soft">활성 구독자</p>
          <p className="mt-2 text-2xl font-bold">{activeSubscribers ?? 0}명</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs font-semibold text-ink-soft">이번 달 매출</p>
          <p className="mt-2 text-2xl font-bold">{formatWon(monthRevenueKrw)}</p>
          {otherCurrencies.length > 0 && (
            <p className="mt-1 text-[11px] font-semibold text-ink-faint">
              {otherCurrencies.map(([c, v]) => `${v.toLocaleString("ko-KR")} ${c}`).join(", ")}
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs font-semibold text-ink-soft">이번 달 지출</p>
          <p className="mt-2 text-2xl font-bold">{formatWon(monthExpenseTotal)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs font-semibold text-ink-soft">최근 7일 AI 생성</p>
          <p className="mt-2 text-2xl font-bold">{weekAiGenerations ?? 0}회</p>
        </div>
      </div>

      <p className="mb-2 text-xs font-bold text-ink-faint">확인이 필요한 항목</p>
      <div className="grid grid-cols-3 gap-3">
        <Link href="/admin/applications" className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs font-semibold text-ink-soft">대기중인 지원서</p>
          <p className="mt-2 text-2xl font-bold">{pendingApplications ?? 0}건</p>
          <p className="mt-1 text-[11px] font-semibold text-accent-ink">확인하러 가기 →</p>
        </Link>
        <Link href="/admin/inquiries" className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs font-semibold text-ink-soft">확인중인 문의</p>
          <p className="mt-2 text-2xl font-bold">{openInquiries ?? 0}건</p>
          <p className="mt-1 text-[11px] font-semibold text-accent-ink">확인하러 가기 →</p>
        </Link>
        <Link href="/admin/ai-reports" className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs font-semibold text-ink-soft">AI 결과 신고</p>
          <p className="mt-2 text-2xl font-bold">{aiReports ?? 0}건</p>
          <p className="mt-1 text-[11px] font-semibold text-accent-ink">확인하러 가기 →</p>
        </Link>
      </div>
    </div>
  );
}
