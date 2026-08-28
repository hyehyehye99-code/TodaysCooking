import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DeleteRecipeButton } from "./delete-recipe-button";

type Creator = { id: string; name: string; icon_emoji: string | null; channel_type: string | null };
type CreatorRecipe = { id: string; title: string; subtitle: string | null; icon_emoji: string | null; tags: string[] };

export default async function AdminCreatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
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

      <Link
        href={`/admin/creators/${id}/new`}
        className="mb-6 block w-full rounded-xl bg-accent py-3 text-center text-sm font-bold text-white"
      >
        + 새 레시피 추가
      </Link>

      <p className="mb-2 text-sm font-bold">레시피 목록 ({list.length})</p>
      {list.length === 0 ? (
        <p className="text-sm text-ink-soft">아직 등록된 레시피가 없어요.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3">
              <span className="text-xl">{r.icon_emoji ?? "🍳"}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{r.title}</p>
                {r.subtitle && <p className="truncate text-xs text-ink-soft">{r.subtitle}</p>}
                {r.tags.length > 0 && (
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-positive-ink">
                    {r.tags.map((t) => `#${t}`).join(" ")}
                  </p>
                )}
              </div>
              <DeleteRecipeButton creatorId={id} recipeId={r.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
