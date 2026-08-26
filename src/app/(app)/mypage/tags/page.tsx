import { BackButton, GlassCard } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { getDictionary } from "@/lib/i18n/server";
import { TagManagementList } from "./tag-management-list";

export default async function TagManagementPage() {
  const { household } = await getCurrentHousehold();
  const { dict } = await getDictionary();
  const supabase = await createClient();

  const [{ data: recipes }, { data: bookmarks }, { data: order }] = await Promise.all([
    supabase.from("recipes").select("tags").eq("household_id", household!.id),
    supabase.from("bookmarks").select("tags").eq("household_id", household!.id),
    supabase
      .from("recipe_tag_order")
      .select("name, position")
      .eq("household_id", household!.id)
      .order("position", { ascending: true }),
  ]);

  const used = new Set<string>();
  for (const r of recipes ?? []) for (const t of r.tags ?? []) used.add(t);
  for (const b of bookmarks ?? []) for (const t of b.tags ?? []) used.add(t);

  // Tags with a saved order come first (in that order); anything used but
  // never saved to recipe_tag_order falls back to alphabetical order after.
  const ordered = (order ?? []).map((o) => o.name).filter((name) => used.has(name));
  const rest = [...used].filter((t) => !ordered.includes(t)).sort((a, b) => a.localeCompare(b, "ko"));
  const tags = [...ordered, ...rest];

  return (
    <div className="pt-2">
      <div className="mb-5 flex items-center gap-3">
        <BackButton href="/mypage" />
        <h1 className="text-[22px] font-bold">{dict.mypage.tagManagement}</h1>
      </div>
      <p className="mb-5 text-sm text-ink-soft">{dict.mypage.tagManagementDesc}</p>

      {tags.length === 0 ? (
        <GlassCard className="bg-white p-4">
          <p className="text-sm text-ink-soft">{dict.mypage.noTagsYet}</p>
        </GlassCard>
      ) : (
        <TagManagementList tags={tags} />
      )}
    </div>
  );
}
