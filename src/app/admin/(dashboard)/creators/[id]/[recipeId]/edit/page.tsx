import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreatorRecipeForm } from "../../new/creator-recipe-form";

type Recipe = {
  id: string;
  title: string;
  subtitle: string | null;
  icon_emoji: string | null;
  cover_photo_urls: string[];
  tags: string[];
  notes: string | null;
};

export default async function EditCreatorRecipePage({
  params,
}: {
  params: Promise<{ id: string; recipeId: string }>;
}) {
  const { id, recipeId } = await params;

  const supabase = createAdminClient();
  const [{ data: creator }, { data: recipe }, { data: ingredients }, { data: allRecipes }] = await Promise.all([
    supabase.from("creators").select("id, name").eq("id", id).maybeSingle(),
    supabase
      .from("creator_recipes")
      .select("id, title, subtitle, icon_emoji, cover_photo_urls, tags, notes")
      .eq("id", recipeId)
      .maybeSingle(),
    supabase
      .from("creator_recipe_ingredients")
      .select("name, amount")
      .eq("creator_recipe_id", recipeId)
      .order("position"),
    supabase.from("creator_recipes").select("tags"),
  ]);

  if (!creator || !recipe) notFound();
  const r = recipe as Recipe;
  const existingTags = [
    ...new Set(((allRecipes as { tags: string[] }[] | null) ?? []).flatMap((row) => row.tags)),
  ];

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/admin/creators/${id}`} className="text-sm font-semibold text-ink-faint">
          ← {creator.name}
        </Link>
      </div>
      <h1 className="mb-6 text-xl font-bold">레시피 수정</h1>
      <CreatorRecipeForm
        creatorId={id}
        existingTags={existingTags}
        initial={{
          recipeId,
          title: r.title,
          subtitle: r.subtitle ?? "",
          iconEmoji: r.icon_emoji ?? "",
          coverPhotoUrl: r.cover_photo_urls?.[0] ?? "",
          tags: r.tags,
          notes: r.notes ?? "",
          ingredients: (ingredients as { name: string; amount: string }[] | null) ?? [],
        }}
      />
    </div>
  );
}
