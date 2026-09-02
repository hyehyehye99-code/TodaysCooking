import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminForExport, xlsxResponse } from "@/lib/admin-export";

export async function GET() {
  const unauthorized = await requireAdminForExport();
  if (unauthorized) return unauthorized;

  const supabase = createAdminClient();
  const [{ data: redemptions }, { data: usersData }, { data: profiles }] = await Promise.all([
    supabase.from("promo_code_redemptions").select("*").order("redeemed_at", { ascending: false }),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from("profiles").select("id, nickname"),
  ]);

  const nicknameById = new Map(
    ((profiles as { id: string; nickname: string }[] | null) ?? []).map((p) => [p.id, p.nickname])
  );
  const emailById = new Map(usersData.users.map((u) => [u.id, u.email ?? ""]));

  type Redemption = {
    user_id: string;
    code: string;
    redeemed_at: string;
    remaining_count: number;
    granted_by: string;
  };
  const rows = ((redemptions as Redemption[] | null) ?? []).map((r) => ({
    닉네임: nicknameById.get(r.user_id) ?? "",
    이메일: emailById.get(r.user_id) ?? "",
    코드: r.code,
    지급방식: r.granted_by === "admin" ? "관리자 지급" : "직접 입력",
    지급일: r.redeemed_at,
    남은횟수: r.remaining_count,
  }));

  return xlsxResponse(rows, "promotions.xlsx");
}
