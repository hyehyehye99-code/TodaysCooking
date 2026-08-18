import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { GlassCard, ProgressBar } from "@/components/ui";
import { addMissingToShopping } from "@/lib/actions/recipes";
import { chefName } from "@/lib/format";
import type { RecipeWithIngredients, CookLog } from "@/lib/types";
import { CookLogForm } from "./cook-log-form";
import { DeleteRecipeButton } from "./delete-recipe-button";
import { DeleteCookLogButton } from "./delete-cook-log-button";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const [
    { data: recipe },
    { data: fridgeItems },
    { data: shoppingItems },
    { data: cookLogs },
    { data: referenceBookmark },
  ] = await Promise.all([
    supabase
      .from("recipes")
      .select("*, recipe_ingredients(*)")
      .eq("id", id)
      .single(),
    supabase.from("fridge_items").select("name, in_stock").eq("household_id", household!.id),
    supabase.from("shopping_items").select("name").eq("household_id", household!.id),
    supabase
      .from("recipe_cook_logs")
      .select("*")
      .eq("recipe_id", id)
      .order("cooked_at", { ascending: false }),
    supabase.from("bookmarks").select("url, domain").eq("recipe_id", id).maybeSingle(),
  ]);

  if (!recipe) notFound();

  const r = recipe as RecipeWithIngredients;
  const logs = (cookLogs as CookLog[] | null) ?? [];

  const { data: creatorProfile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", r.created_by)
    .maybeSingle();

  const owned = new Set((fridgeItems ?? []).filter((i) => i.in_stock).map((i) => i.name));
  const onShoppingList = new Set((shoppingItems ?? []).map((i) => i.name));

  const ingredients = r.recipe_ingredients;
  const missing = ingredients.filter((ing) => !owned.has(ing.name));
  const makeable = missing.length === 0;
  const allAdded = missing.length > 0 && missing.every((m) => onShoppingList.has(m.name));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="min-w-0 flex-1 text-[22px] font-bold">{r.title}</h1>
        <Link
          href="/recipes"
          aria-label="닫기"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-ink"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </Link>
      </div>

      {r.cover_photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={r.cover_photo_url}
          alt=""
          className="mb-4 h-48 w-full rounded-2xl object-cover"
        />
      ) : r.icon_emoji ? (
        <div className="mb-4 flex h-48 w-full items-center justify-center rounded-2xl bg-surface text-6xl">
          {r.icon_emoji}
        </div>
      ) : (
        <div className="mb-4 flex h-48 w-full items-center justify-center rounded-2xl bg-surface">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="var(--color-accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 5.5c2.2-1 5.2-1 8 0 2.8-1 5.8-1 8 0v13c-2.2-1-5.2-1-8 0-2.8-1-5.8-1-8 0z" />
            <path d="M12 5.5v13" />
          </svg>
        </div>
      )}

      {r.subtitle && <p className="text-sm text-ink-soft">{r.subtitle}</p>}
      <p className="mt-1 text-xs text-ink-faint">{chefName(creatorProfile?.nickname)} 등록</p>
      {r.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {r.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-accent"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      {referenceBookmark && (
        <a
          href={referenceBookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent"
        >
          참고 링크 보기 ({referenceBookmark.domain}) →
        </a>
      )}

      <div className="mt-5">
        <p className="mb-1.5 text-xs text-ink-soft">
          보유 재료 {ingredients.length - missing.length}/{ingredients.length}
        </p>
        <ProgressBar
          percent={((ingredients.length - missing.length) / (ingredients.length || 1)) * 100}
        />
      </div>

      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {ingredients.map((ing) => (
          <span
            key={ing.id}
            className={`rounded-full border border-transparent px-2.5 py-1 text-xs font-semibold ${
              owned.has(ing.name) ? "bg-positive/10 text-positive-ink" : "bg-warn/10 text-warn-ink"
            }`}
          >
            {ing.name}
          </span>
        ))}
      </div>

      <div className="mt-4">
        {makeable ? (
          <div className="flex items-center gap-2 rounded-xl border border-transparent bg-positive/10 px-3 py-2.5">
            <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="var(--color-positive-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 7.5l3 3 6-7" />
            </svg>
            <span className="text-[13px] font-bold text-positive-ink">바로 만들 수 있어요</span>
          </div>
        ) : allAdded ? (
          <div className="flex items-center justify-center gap-1.5 rounded-xl border border-transparent bg-surface py-2.5">
            <span className="text-[13px] font-bold text-ink-faint">장보기에 담겨 있어요</span>
          </div>
        ) : (
          <form action={addMissingToShopping}>
            <input type="hidden" name="recipeId" value={r.id} />
            <button
              type="submit"
              className="w-full rounded-xl bg-accent py-2.5 text-[13px] font-bold text-white"
            >
              부족한 재료 장보기 담기
            </button>
          </form>
        )}
      </div>

      {r.notes && (
        <div className="mt-6">
          <p className="mb-2 text-[15px] font-bold">메모</p>
          <GlassCard className="bg-surface p-4">
            <p className="whitespace-pre-line text-sm text-ink-soft">{r.notes}</p>
          </GlassCard>
        </div>
      )}

      <div className="mt-8">
        <p className="mb-3 text-[15px] font-bold">요리한 사진</p>
        <CookLogForm recipeId={r.id} />

        {logs.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {logs.map((log) => (
              <GlassCard key={log.id} className="overflow-hidden bg-white p-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={log.photo_url} alt="" className="h-32 w-full object-cover" />
                <div className="flex items-center justify-between px-2.5 py-2">
                  <div>
                    <p className="text-[11px] text-ink-soft">{log.cooked_at}</p>
                    {log.rating && (
                      <p className="mt-0.5 text-xs text-warn-ink">{"★".repeat(log.rating)}</p>
                    )}
                  </div>
                  <DeleteCookLogButton id={log.id} recipeId={r.id} />
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <DeleteRecipeButton recipeId={r.id} />
        <Link href={`/recipes/${r.id}/edit`} className="text-sm font-bold text-accent">
          수정하기
        </Link>
      </div>
    </div>
  );
}
