import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminHomePage() {
  const supabase = createAdminClient();
  const [
    { count: creatorCount },
    { count: recipeCount },
    { count: pendingApplications },
    { data: usersData },
    { count: openInquiries },
    { count: aiReports },
  ] = await Promise.all([
    supabase.from("creators").select("id", { count: "exact", head: true }),
    supabase.from("creator_recipes").select("id", { count: "exact", head: true }),
    supabase.from("creator_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("ai_recipe_reports").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">대시보드</h1>
      <p className="mb-6 text-sm text-ink-soft">우리집 레시피 관리자 대시보드예요.</p>

      <div className="mb-3 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs font-semibold text-ink-soft">크리에이터</p>
          <p className="mt-2 text-2xl font-bold">{creatorCount ?? 0}명</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs font-semibold text-ink-soft">등록된 레시피</p>
          <p className="mt-2 text-2xl font-bold">{recipeCount ?? 0}개</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs font-semibold text-ink-soft">전체 유저</p>
          <p className="mt-2 text-2xl font-bold">{usersData.users.length}명</p>
        </div>
      </div>

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
