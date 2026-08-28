import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminForExport, xlsxResponse } from "@/lib/admin-export";

export async function GET() {
  const unauthorized = await requireAdminForExport();
  if (unauthorized) return unauthorized;

  const supabase = createAdminClient();
  const [{ data: reports }, { data: profiles }] = await Promise.all([
    supabase.from("ai_recipe_reports").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, nickname"),
  ]);

  const nicknameById = new Map(
    ((profiles as { id: string; nickname: string }[] | null) ?? []).map((p) => [p.id, p.nickname])
  );

  type Report = {
    user_id: string;
    url: string;
    generated_title: string | null;
    generated_ingredients: string[];
    generated_instructions: string;
    generated_tags: string[];
    note: string | null;
    created_at: string;
  };
  const rows = ((reports as Report[] | null) ?? []).map((r) => ({
    신고자: nicknameById.get(r.user_id) ?? "",
    링크: r.url,
    제목: r.generated_title ?? "",
    재료: r.generated_ingredients.join(", "),
    만드는법: r.generated_instructions,
    태그: r.generated_tags.join(", "),
    신고사유: r.note ?? "",
    신고일: r.created_at,
  }));

  return xlsxResponse(rows, "ai_recipe_reports.xlsx");
}
