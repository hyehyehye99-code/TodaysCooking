import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { PageHeader } from "@/components/ui";
import { CookingPhotoGrid } from "./photo-grid";
import type { CookLog } from "@/lib/types";

export default async function CookingPhotosPage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const { data } = await supabase
    .from("recipe_cook_logs")
    .select("*, recipes(title)")
    .eq("household_id", household!.id)
    .order("cooked_at", { ascending: false });

  const logs = (data as (CookLog & { recipes: { title: string } | null })[] | null) ?? [];

  return (
    <div>
      <PageHeader title="요리 사진" />

      {logs.length === 0 ? (
        <p className="mt-10 text-center text-sm text-ink-soft">
          레시피 상세 화면에서 요리한 사진을 올리면 여기 모여요.
        </p>
      ) : (
        <CookingPhotoGrid logs={logs} />
      )}
    </div>
  );
}
