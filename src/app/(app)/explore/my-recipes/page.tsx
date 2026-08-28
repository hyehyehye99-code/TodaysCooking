import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { getDictionary } from "@/lib/i18n/server";
import { MyRecipesList, type MyRecipe } from "./my-recipes-list";

export default async function MyExploreRecipesPage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();
  const { dict } = await getDictionary();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, subtitle, cover_photo_urls, icon_emoji, is_public")
    .eq("household_id", household!.id)
    .order("position", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <div className="animate-fade-in-up pt-2">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-[22px] font-bold">{dict.explore.myRecipesHeading}</h1>
        <Link
          href="/explore"
          aria-label={dict.common.close}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-ink"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </Link>
      </div>
      <p className="mb-4 text-xs text-ink-soft">{dict.explore.myRecipesDesc}</p>
      <MyRecipesList recipes={(recipes as MyRecipe[] | null) ?? []} />
    </div>
  );
}
