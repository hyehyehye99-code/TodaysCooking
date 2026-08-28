import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminForExport, xlsxResponse } from "@/lib/admin-export";

export async function GET() {
  const unauthorized = await requireAdminForExport();
  if (unauthorized) return unauthorized;

  const supabase = createAdminClient();
  const [{ data: apps }, { data: profiles }] = await Promise.all([
    supabase.from("creator_applications").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, nickname"),
  ]);

  const nicknameById = new Map(
    ((profiles as { id: string; nickname: string }[] | null) ?? []).map((p) => [p.id, p.nickname])
  );

  type Application = {
    applicant_user_id: string;
    creator_name: string;
    channel_type: string | null;
    channel_name: string | null;
    channel_link: string | null;
    tags: string[];
    representative_links: string[];
    status: string;
    created_at: string;
  };
  const rows = ((apps as Application[] | null) ?? []).map((a) => ({
    신청자: nicknameById.get(a.applicant_user_id) ?? "",
    크리에이터이름: a.creator_name,
    채널종류: a.channel_type ?? "",
    채널이름: a.channel_name ?? "",
    채널링크: a.channel_link ?? "",
    태그: a.tags.join(", "),
    대표링크: a.representative_links.join(", "),
    상태: a.status,
    신청일: a.created_at,
  }));

  return xlsxResponse(rows, "creator_applications.xlsx");
}
