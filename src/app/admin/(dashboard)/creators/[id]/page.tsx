import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { DeleteRecipeButton } from "./delete-recipe-button";

type Creator = { id: string; name: string; icon_emoji: string | null; channel_type: string | null };
type CreatorRecipe = { id: string; title: string; subtitle: string | null; icon_emoji: string | null; tags: string[] };

export default async function AdminCreatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = createAdminClient();
  const [{ data: creator }, { data: recipes }] = await Promise.all([
    supabase.from("creators").select("id, name, icon_emoji, channel_type").eq("id", id).maybeSingle(),
    supabase
      .from("creator_recipes")
      .select("id, title, subtitle, icon_emoji, tags")
      .eq("creator_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!creator) notFound();
  const list = (recipes as CreatorRecipe[] | null) ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/creators" className="text-sm font-semibold text-ink-faint">
          ← 목록
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <span className="text-2xl">{(creator as Creator).icon_emoji ?? "👤"}</span>
        <div>
          <h1 className="text-xl font-bold">{(creator as Creator).name}</h1>
          {(creator as Creator).channel_type && (
            <p className="text-xs text-ink-soft">{(creator as Creator).channel_type}</p>
          )}
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        <Link
          href={`/admin/creators/${id}/new`}
          className="flex-1 rounded-xl bg-accent py-3 text-center text-sm font-bold text-white"
        >
          + 새 레시피 추가
        </Link>
        <Link
          href="/admin/import"
          className="flex-1 rounded-xl border border-accent bg-white py-3 text-center text-sm font-bold text-accent-ink"
        >
          엑셀로 가져오기
        </Link>
      </div>

      <p className="mb-2 text-sm font-bold">레시피 목록 ({list.length})</p>
      {list.length === 0 ? (
        <p className="text-sm text-ink-soft">아직 등록된 레시피가 없어요.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs text-ink-soft">
                <th className="w-10 px-3 py-2 font-semibold" />
                <th className="px-3 py-2 font-semibold">제목</th>
                <th className="px-3 py-2 font-semibold">한 줄 소개</th>
                <th className="px-3 py-2 font-semibold">태그</th>
                <th className="w-20 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="px-3 py-2 text-lg">{r.icon_emoji ?? "🍳"}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/creators/${id}/${r.id}/edit`}
                      className="font-bold text-ink underline-offset-2 hover:underline"
                    >
                      {r.title}
                    </Link>
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-2 text-ink-soft">{r.subtitle}</td>
                  <td className="max-w-[200px] truncate px-3 py-2 text-[12px] font-semibold text-positive-ink">
                    {r.tags.map((t) => `#${t}`).join(" ")}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <DeleteRecipeButton creatorId={id} recipeId={r.id} />
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
