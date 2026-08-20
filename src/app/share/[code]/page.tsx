import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { RecipeThumb } from "@/components/RecipeThumb";
import { ReactButton } from "./react-button";

// This is an unlisted link, not a public listing — keep it out of search
// results even though the page itself needs no login to view.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type SharedRecipe = {
  id: string;
  title: string;
  subtitle: string | null;
  cover_photo_urls: string[];
  icon_emoji: string | null;
  tags: string[];
};

export default async function SharePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();

  const shell = (content: React.ReactNode) => (
    <div className="mx-auto min-h-dvh w-full max-w-[520px] px-5 pt-[max(env(safe-area-inset-top),24px)] pb-[max(env(safe-area-inset-bottom),40px)]">
      {content}
    </div>
  );

  const { data: household } = (await supabase
    .rpc("get_shared_household", { p_share_code: code })
    .maybeSingle()) as { data: { id: string; name: string } | null };

  if (!household) {
    return shell(
      <div className="flex h-[70dvh] flex-col items-center justify-center text-center">
        <span className="text-[48px] leading-none">🍳</span>
        <p className="mt-4 text-lg font-bold">유효하지 않은 공유 링크예요</p>
        <p className="mt-2 text-sm text-ink-soft">링크가 꺼져 있거나 잘못된 주소예요.</p>
        <Link href="/" className="mt-4 text-sm font-bold text-accent underline">
          홈으로 가기
        </Link>
      </div>
    );
  }

  const [{ data: recipes }, { data: userData }] = await Promise.all([
    supabase.rpc("get_shared_recipes", { p_share_code: code }),
    supabase.auth.getUser(),
  ]);

  const list = (recipes as SharedRecipe[] | null) ?? [];
  const user = userData.user;

  let reactedIds = new Set<string>();
  if (user && list.length > 0) {
    const { data: myReactions } = await supabase
      .from("recipe_reactions")
      .select("recipe_id")
      .eq("user_id", user.id)
      .in("recipe_id", list.map((r) => r.id));
    reactedIds = new Set((myReactions ?? []).map((r) => r.recipe_id));
  }

  return shell(
    <div>
      <div className="flex items-center justify-center gap-1.5 pb-4 pt-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.svg" alt="" width={16} height={16} />
        <span className="text-xs font-bold text-ink-faint">우리집 메뉴판</span>
      </div>

      <div className="pb-6 text-center">
        <h1 className="text-2xl font-bold">{household.name}</h1>
        <p className="mt-1.5 text-sm text-ink-soft">{household.name}의 메뉴판이에요</p>
      </div>

      {list.length === 0 ? (
        <p className="mt-10 text-center text-sm text-ink-soft">아직 공개된 메뉴가 없어요.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((recipe) => (
            <div
              key={recipe.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3.5"
            >
              <RecipeThumb
                coverPhotoUrl={recipe.cover_photo_urls[0]}
                iconEmoji={recipe.icon_emoji}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold">{recipe.title}</p>
                {recipe.subtitle && (
                  <p className="mt-0.5 truncate text-xs text-ink-soft">{recipe.subtitle}</p>
                )}
                {recipe.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {recipe.tags.map((tag) => (
                      <span key={tag} className="text-[10px] font-semibold text-positive-ink">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <ReactButton
                recipeId={recipe.id}
                shareCode={code}
                isLoggedIn={!!user}
                initiallyReacted={reactedIds.has(recipe.id)}
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-border bg-surface p-6 text-center">
        <p className="text-base font-bold">나도 이런 메뉴판 만들어볼까?</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          레시피, 냉장고, 장보기 목록까지 — 파트너와 함께 쓰는 우리집 메뉴판.
        </p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-xl bg-accent px-6 py-3.5 text-sm font-bold text-white"
        >
          우리집 메뉴판 시작하기
        </Link>
      </div>
    </div>
  );
}
