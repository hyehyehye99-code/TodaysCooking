import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

type Row = {
  id: string;
  title: string;
  subtitle: string | null;
  icon_emoji: string | null;
  tags: string[];
  creator_id: string;
  creators: { name: string } | { name: string }[] | null;
};

function creatorName(row: Row): string {
  const c = row.creators;
  if (!c) return "-";
  return Array.isArray(c) ? (c[0]?.name ?? "-") : c.name;
}

export default async function AdminCreatorRecipesPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("creator_recipes")
    .select("id, title, subtitle, icon_emoji, tags, creator_id, creators ( name )")
    .order("created_at", { ascending: false });

  const rows = (data as Row[] | null) ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">크리에이터 레시피 관리</h1>
          <p className="mt-1 text-sm text-ink-soft">전체 크리에이터의 레시피 {rows.length}개예요.</p>
        </div>
        <a
          href="/admin/creator-recipes/export"
          className="rounded-xl border border-accent bg-white px-3.5 py-2.5 text-xs font-bold text-accent-ink"
        >
          ⬇ 엑셀로 내보내기
        </a>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-soft">아직 등록된 레시피가 없어요.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs text-ink-soft">
                <th className="w-10 px-3 py-2 font-semibold" />
                <th className="px-3 py-2 font-semibold">제목</th>
                <th className="px-3 py-2 font-semibold">크리에이터</th>
                <th className="px-3 py-2 font-semibold">한 줄 소개</th>
                <th className="px-3 py-2 font-semibold">태그</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="px-3 py-2 text-lg">{r.icon_emoji}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/creators/${r.creator_id}/${r.id}/edit`}
                      className="font-bold text-ink underline-offset-2 hover:underline"
                    >
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/creators/${r.creator_id}`} className="text-accent-ink underline-offset-2 hover:underline">
                      {creatorName(r)}
                    </Link>
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-2 text-ink-soft">{r.subtitle}</td>
                  <td className="max-w-[220px] truncate px-3 py-2 text-[12px] font-semibold text-positive-ink">
                    {r.tags.map((t) => `#${t}`).join(" ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
