import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { AddBookmarkForm } from "./add-bookmark-form";
import { BookmarkList } from "./bookmark-list";
import type { Bookmark } from "@/lib/types";

export default async function BookmarksPage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const { data } = await supabase
    .from("bookmarks")
    .select("*, recipes(title)")
    .eq("household_id", household!.id)
    .order("position", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const bookmarks = (data as (Bookmark & { recipes: { title: string } | null })[] | null) ?? [];
  const existingTags = [...new Set(bookmarks.flatMap((b) => b.tags))];

  return (
    <div>
      <AddBookmarkForm existingTags={existingTags} />
      <div className="mt-5">
        <BookmarkList bookmarks={bookmarks} />
      </div>
    </div>
  );
}
