import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { TimerForm } from "../timer-form";
import type { RecipeOption } from "../timer-form";

export default async function NewTimerPage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, cover_photo_urls, icon_emoji, is_cooking, bookmarks(thumbnail_url)")
    .eq("household_id", household!.id)
    .not("title", "is", null)
    .order("is_cooking", { ascending: false })
    .order("title", { ascending: true });

  return <TimerForm recipes={(recipes as RecipeOption[] | null) ?? []} />;
}
