import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { RecipeThumb } from "@/components/RecipeThumb";
import { DeleteRecipeButton } from "./delete-recipe-button";
import { CreatorHeader } from "./creator-header";
import { CreatorActionBar } from "./creator-action-bar";

type Creator = {
  id: string;
  name: string;
  icon_emoji: string | null;
  avatar_url: string | null;
  channel_type: string | null;
  channel_name: string | null;
  channel_link: string | null;
  tags: string[];
};
type CreatorRecipe = {
  id: string;
  title: string;
  subtitle: string | null;
  icon_emoji: string | null;
  cover_photo_urls: string[];
  tags: string[];
  source_url: string | null;
};

export default async function AdminCreatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = createAdminClient();
  const [{ data: creator }, { data: recipes }] = await Promise.all([
    supabase
      .from("creators")
      .select("id, name, icon_emoji, avatar_url, channel_type, channel_name, channel_link, tags")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("creator_recipes")
      .select("id, title, subtitle, icon_emoji, cover_photo_urls, tags, source_url")
      .eq("creator_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!creator) notFound();
  const list = (recipes as CreatorRecipe[] | null) ?? [];
  const typedCreator = creator as Creator;
  const isYoutubeChannel = !!typedCreator.channel_link && /(^|\.)youtube\.com|youtu\.be/i.test(typedCreator.channel_link);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/creators" className="text-sm font-semibold text-ink-faint">
          ← 목록
        </Link>
      </div>

      <CreatorHeader creator={typedCreator} recipeCount={list.length} />

      <CreatorActionBar creatorId={id} channelLink={isYoutubeChannel ? typedCreator.channel_link : null} />

      <p className="mb-2 text-sm font-bold">레시피 목록 ({list.length})</p>
      {list.length === 0 ? (
        <p className="text-sm text-ink-soft">아직 등록된 레시피가 없어요.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs text-ink-soft">
                <th className="w-14 px-3 py-2 font-semibold" />
                <th className="px-3 py-2 font-semibold">제목</th>
                <th className="px-3 py-2 font-semibold">한 줄 소개</th>
                <th className="px-3 py-2 font-semibold">태그</th>
                <th className="w-10 px-3 py-2" />
                <th className="w-20 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="px-3 py-2">
                    <RecipeThumb coverPhotoUrl={r.cover_photo_urls[0]} iconEmoji={r.icon_emoji} size={40} />
                  </td>
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
