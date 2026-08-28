import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { RecipeThumb } from "@/components/RecipeThumb";

type Row = {
  id: string;
  title: string;
  subtitle: string | null;
  icon_emoji: string | null;
  cover_photo_urls: string[];
  tags: string[];
  creator_id: string;
  source_url: string | null;
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
    .select("id, title, subtitle, icon_emoji, cover_photo_urls, tags, creator_id, source_url, creators ( name )")
    .order("created_at", { ascending: false });

  const rows = (data as Row[] | null) ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">크리에이터 레시피 관리</h1>
          <p className="mt-1 text-sm text-ink-soft">전체 크리에이터의 레시피 {rows.length}개예요.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/import" className="text-xs font-bold text-accent-ink">
            엑셀로 가져오기
          </Link>
          <a
            href="/admin/creator-recipes/export"
            className="rounded-xl border border-accent bg-white px-3.5 py-2.5 text-xs font-bold text-accent-ink"
          >
            ⬇ 엑셀로 내보내기
          </a>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-soft">아직 등록된 레시피가 없어요.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs text-ink-soft">
                <th className="w-14 px-3 py-2 font-semibold" />
                <th className="px-3 py-2 font-semibold">제목</th>
                <th className="px-3 py-2 font-semibold">크리에이터</th>
                <th className="px-3 py-2 font-semibold">한 줄 소개</th>
                <th className="px-3 py-2 font-semibold">태그</th>
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="px-3 py-2">
                    <RecipeThumb coverPhotoUrl={r.cover_photo_urls[0]} iconEmoji={r.icon_emoji} size={40} />
                  </td>
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
                  <td className="px-3 py-2">
                    {r.source_url && (
                      <a
                        href={r.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="원본 링크 열기"
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-ink-faint hover:bg-surface hover:text-accent-ink"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 4h6v6" />
                          <path d="M20 4 10 14" />
                          <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
                        </svg>
                      </a>
                    )}
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
