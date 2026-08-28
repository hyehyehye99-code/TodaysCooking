import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminForExport, xlsxResponse } from "@/lib/admin-export";

export async function GET() {
  const unauthorized = await requireAdminForExport();
  if (unauthorized) return unauthorized;

  const supabase = createAdminClient();
  const { data } = await supabase.rpc("list_creators");

  type Creator = { name: string; channel_type: string | null; tags: string[]; recipe_count: number };
  const rows = ((data as Creator[] | null) ?? []).map((c) => ({
    이름: c.name,
    채널종류: c.channel_type ?? "",
    태그: c.tags.join(", "),
    레시피수: c.recipe_count,
  }));

  return xlsxResponse(rows, "creators.xlsx");
}
