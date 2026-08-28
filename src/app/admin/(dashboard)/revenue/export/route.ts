import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminForExport, xlsxResponse } from "@/lib/admin-export";

export async function GET() {
  const unauthorized = await requireAdminForExport();
  if (unauthorized) return unauthorized;

  const supabase = createAdminClient();
  const [{ data: events }, { data: households }] = await Promise.all([
    supabase.from("subscription_events").select("*").order("occurred_at", { ascending: false }),
    supabase.from("households").select("id, name"),
  ]);

  const householdNameById = new Map(
    ((households as { id: string; name: string }[] | null) ?? []).map((h) => [h.id, h.name])
  );

  type Event = {
    household_id: string;
    event_type: string;
    product_id: string | null;
    price: number | null;
    currency: string | null;
    occurred_at: string;
  };
  const rows = ((events as Event[] | null) ?? []).map((r) => ({
    일시: r.occurred_at,
    우리집: householdNameById.get(r.household_id) ?? "",
    이벤트: r.event_type,
    상품: r.product_id ?? "",
    금액: r.price ?? "",
    통화: r.currency ?? "",
  }));

  return xlsxResponse(rows, "revenue.xlsx");
}
