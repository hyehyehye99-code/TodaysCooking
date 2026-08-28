import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminForExport, xlsxResponse } from "@/lib/admin-export";

export async function GET() {
  const unauthorized = await requireAdminForExport();
  if (unauthorized) return unauthorized;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("creator_recipes")
    .select("title, subtitle, tags, notes, creator_id, creators ( name )")
    .order("created_at", { ascending: false });

  type Row = {
    title: string;
    subtitle: string | null;
    tags: string[];
    notes: string | null;
    creators: { name: string } | { name: string }[] | null;
  };
  const rows = ((data as Row[] | null) ?? []).map((r) => {
    const c = r.creators;
    const creatorName = Array.isArray(c) ? (c[0]?.name ?? "") : (c?.name ?? "");
    return {
      크리에이터: creatorName,
      제목: r.title,
      한줄소개: r.subtitle ?? "",
      태그: r.tags.join(", "),
      만드는법: r.notes ?? "",
    };
  });

  return xlsxResponse(rows, "creator_recipes.xlsx");
}
