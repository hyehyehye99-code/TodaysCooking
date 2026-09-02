import { BackButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { INGREDIENT_CATEGORIES } from "@/lib/ingredients";
import { getDictionary } from "@/lib/i18n/server";
import { FridgeIngredientVisibilityList } from "./fridge-ingredient-visibility-list";

export default async function FridgeIngredientsPage() {
  const { household } = await getCurrentHousehold();
  const { dict } = await getDictionary();
  const supabase = await createClient();

  const { data } = await supabase
    .from("fridge_hidden_ingredients")
    .select("name")
    .eq("household_id", household!.id);

  const hiddenNames = (data ?? []).map((r) => r.name as string);

  return (
    <div className="pt-2">
      <div className="mb-5 flex items-center gap-3">
        <BackButton href="/mypage" />
        <h1 className="text-[22px] font-bold">{dict.mypage.fridgeIngredientManagement}</h1>
      </div>
      <p className="mb-5 text-sm text-ink-soft">{dict.mypage.fridgeIngredientManagementDesc}</p>

      <FridgeIngredientVisibilityList categories={INGREDIENT_CATEGORIES} hiddenNames={hiddenNames} />
    </div>
  );
}
