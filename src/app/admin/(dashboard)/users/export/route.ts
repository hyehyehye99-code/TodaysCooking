import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminForExport, xlsxResponse } from "@/lib/admin-export";

export async function GET() {
  const unauthorized = await requireAdminForExport();
  if (unauthorized) return unauthorized;

  const supabase = createAdminClient();
  const [{ data: usersData }, { data: profiles }] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from("profiles").select("id, nickname"),
  ]);

  const nicknameById = new Map(
    ((profiles as { id: string; nickname: string }[] | null) ?? []).map((p) => [p.id, p.nickname])
  );
  const rows = usersData.users.map((u) => ({
    닉네임: nicknameById.get(u.id) ?? "",
    이메일: u.email ?? "",
    가입일: u.created_at,
    마지막로그인: u.last_sign_in_at ?? "",
  }));

  return xlsxResponse(rows, "users.xlsx");
}
