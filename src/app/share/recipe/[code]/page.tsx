import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui";
import { RecipePhotoGallery } from "@/app/(app)/recipes/[id]/recipe-photo-gallery";

// This is an unlisted link, not a public listing — keep it out of search
// results even though the page itself needs no login to view.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type SharedIngredient = { name: string; amount: string | null; skipped: boolean };

type SharedRecipe = {
  id: string;
  title: string;
  subtitle: string | null;
  cover_photo_urls: string[];
  icon_emoji: string | null;
  tags: string[];
  notes: string | null;
  ingredients: SharedIngredient[];
};

export default async function SharedRecipePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();

  const shell = (content: React.ReactNode) => (
    <div className="h-dvh w-full overflow-y-auto overscroll-contain">
      <div className="mx-auto w-full max-w-[520px] px-5 pt-[max(env(safe-area-inset-top),24px)] pb-[max(env(safe-area-inset-bottom),40px)]">
        {content}
      </div>
    </div>
  );

  const { data: recipe } = (await supabase
    .rpc("get_shared_recipe", { p_share_code: code })
    .maybeSingle()) as { data: SharedRecipe | null };

  if (!recipe) {
    return shell(
      <div className="flex h-[70dvh] flex-col items-center justify-center text-center">
        <span className="text-[48px] leading-none">🍳</span>
        <p className="mt-4 text-lg font-bold">유효하지 않은 공유 링크예요</p>
        <p className="mt-2 text-sm text-ink-soft">링크가 꺼져 있거나 잘못된 주소예요.</p>
        <Link href="/welcome" className="mt-4 text-sm font-bold text-accent underline">
          홈으로 가기
        </Link>
      </div>
    );
  }

  return shell(
    <div>
      <div className="flex items-center justify-center gap-1.5 pb-4 pt-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.svg" alt="" width={16} height={16} />
        <span className="text-xs font-bold text-ink-faint">우리집 레시피</span>
      </div>

      {recipe.cover_photo_urls.length > 0 ? (
        <RecipePhotoGallery photos={recipe.cover_photo_urls} />
      ) : recipe.icon_emoji ? (
        <div className="mb-4 flex aspect-square w-full items-center justify-center rounded-2xl bg-surface text-[64px]">
          {recipe.icon_emoji}
        </div>
      ) : null}

      <h1 className="text-2xl font-bold">{recipe.title}</h1>
      {recipe.subtitle && <p className="mt-1 text-sm text-ink-soft">{recipe.subtitle}</p>}
      {recipe.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {recipe.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-positive-ink">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {recipe.ingredients.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-[15px] font-bold">재료</p>
          <div className="flex flex-wrap gap-2">
            {recipe.ingredients.map((ing) => (
              <span
                key={ing.name}
                className="rounded-full border border-transparent bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink-soft"
              >
                {ing.name}
                {ing.amount && <span className="ml-1 font-normal opacity-70">{ing.amount}</span>}
                {ing.skipped && <span className="ml-1 text-[10px] font-normal">(생략)</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {recipe.notes && (
        <div className="mt-6">
          <p className="mb-2 text-[15px] font-bold">만드는 법</p>
          <GlassCard className="bg-surface p-4">
            <p className="whitespace-pre-line text-sm text-ink">{recipe.notes}</p>
          </GlassCard>
        </div>
      )}

      <p className="mt-10 text-center text-[11px] text-ink-faint">
        <Link href="/welcome" className="underline">
          나도 이런 레시피 만들어볼까?
        </Link>
      </p>
    </div>
  );
}
