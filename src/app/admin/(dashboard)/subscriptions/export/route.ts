import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminForExport, xlsxResponse } from "@/lib/admin-export";

export async function GET() {
  const unauthorized = await requireAdminForExport();
  if (unauthorized) return unauthorized;

  const supabase = createAdminClient();
  const [{ data: subs }, { data: households }] = await Promise.all([
    supabase.from("household_subscriptions").select("*").order("updated_at", { ascending: false }),
    supabase.from("households").select("id, name"),
  ]);

  const householdNameById = new Map(
    ((households as { id: string; name: string }[] | null) ?? []).map((h) => [h.id, h.name])
  );

  type Sub = { household_id: string; active: boolean; product_id: string | null; expires_at: string | null; updated_at: string };
  const rows = ((subs as Sub[] | null) ?? []).map((s) => ({
    우리집: householdNameById.get(s.household_id) ?? "",
    상태: s.active ? "활성" : "만료",
    상품ID: s.product_id ?? "",
    만료일: s.expires_at ?? "",
    갱신일: s.updated_at,
  }));

  return xlsxResponse(rows, "subscriptions.xlsx");
}
