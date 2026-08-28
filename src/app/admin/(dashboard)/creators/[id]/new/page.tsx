import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreatorRecipeForm } from "./creator-recipe-form";

export default async function AdminNewCreatorRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = createAdminClient();
  const [{ data: creator }, { data: recipes }] = await Promise.all([
    supabase.from("creators").select("id, name").eq("id", id).maybeSingle(),
    supabase.from("creator_recipes").select("tags"),
  ]);

  if (!creator) notFound();
  const existingTags = [
    ...new Set(((recipes as { tags: string[] }[] | null) ?? []).flatMap((r) => r.tags)),
  ];

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/admin/creators/${id}`} className="text-sm font-semibold text-ink-faint">
          ← {creator.name}
        </Link>
      </div>
      <h1 className="mb-6 text-xl font-bold">새 레시피 추가</h1>
      <CreatorRecipeForm creatorId={id} existingTags={existingTags} />
    </div>
  );
}
