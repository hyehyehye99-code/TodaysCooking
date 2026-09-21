import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { buildFridgeCategories } from "@/lib/fridgeCategories";
import { FridgeEditor } from "./fridge-editor";
import { GuestFridge } from "./guest-fridge";
import type { FridgeItem } from "@/lib/types";
import { BackButton } from "@/components/ui";
import { getDictionary } from "@/lib/i18n/server";

export default async function FridgePage() {
  const { user, household } = await getCurrentHousehold();
  const { dict } = await getDictionary();

  let body: React.ReactNode;
  if (!user) {
    body = <GuestFridge />;
  } else {
    const supabase = await createClient();
    const { data } = await supabase.from("fridge_items").select("*").eq("household_id", household!.id);
    body = <FridgeEditor categories={buildFridgeCategories((data as FridgeItem[] | null) ?? [])} />;
  }

  return (
    <div className="pt-2">
      <div className="mb-5 flex items-center gap-3">
        <BackButton href="/mypage" />
        <h1 className="text-[22px] font-bold">{dict.mypage.fridge}</h1>
      </div>
      {body}
    </div>
  );
}
