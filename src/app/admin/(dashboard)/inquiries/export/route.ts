import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminForExport, xlsxResponse } from "@/lib/admin-export";

export async function GET() {
  const unauthorized = await requireAdminForExport();
  if (unauthorized) return unauthorized;

  const supabase = createAdminClient();
  const [{ data: inquiries }, { data: profiles }] = await Promise.all([
    supabase.from("inquiries").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, nickname"),
  ]);

  const nicknameById = new Map(
    ((profiles as { id: string; nickname: string }[] | null) ?? []).map((p) => [p.id, p.nickname])
  );

  type Inquiry = {
    user_id: string;
    message: string;
    status: string;
    admin_note: string | null;
    created_at: string;
  };
  const rows = ((inquiries as Inquiry[] | null) ?? []).map((q) => ({
    작성자: nicknameById.get(q.user_id) ?? "",
    내용: q.message,
    상태: q.status,
    답변: q.admin_note ?? "",
    작성일: q.created_at,
  }));

  return xlsxResponse(rows, "inquiries.xlsx");
}
