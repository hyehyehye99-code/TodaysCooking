import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { INGREDIENT_CATEGORIES, ALL_KNOWN_INGREDIENTS } from "@/lib/ingredients";
import { FridgeEditor } from "./fridge-editor";
import type { FridgeItem } from "@/lib/types";
import { BackButton } from "@/components/ui";
import { getDictionary } from "@/lib/i18n/server";

function bySelectedFirst<T extends { selected: boolean }>(items: T[]) {
  return [...items].sort((a, b) => Number(b.selected) - Number(a.selected));
}

export default async function FridgePage() {
  const { household } = await getCurrentHousehold();
  const { dict } = await getDictionary();
  const supabase = await createClient();

  const { data } = await supabase.from("fridge_items").select("*").eq("household_id", household!.id);

  const fridgeItems = (data as FridgeItem[] | null) ?? [];
  const stock = new Map(fridgeItems.map((i) => [i.name, i.in_stock]));

  const customItems = fridgeItems.filter((i) => !ALL_KNOWN_INGREDIENTS.has(i.name));
  const staticNames = new Set(INGREDIENT_CATEGORIES.map((c) => c.name));

  const staticCategories = INGREDIENT_CATEGORIES.map((cat) => ({
    name: cat.name,
    items: bySelectedFirst([
      ...cat.items.map((name) => ({ name, selected: !!stock.get(name), custom: false })),
      ...customItems
        .filter((i) => (i.category ?? "미분류") === cat.name)
        .map((i) => ({ name: i.name, selected: i.in_stock, custom: true })),
    ]),
  }));

  // "미분류" goes first, not appended after the named categories — it's
  // where every not-yet-sorted item lands, so it needs to be the thing
  // users see first in order to drag items out of it into a real category.
  const extraCategoryNames = [
    ...new Set(
      customItems
        .map((i) => i.category ?? "미분류")
        .filter((name) => !staticNames.has(name))
    ),
  ];
  const categories = [
    ...extraCategoryNames.map((name) => ({
      name,
      items: bySelectedFirst(
        customItems
          .filter((i) => (i.category ?? "미분류") === name)
          .map((i) => ({ name: i.name, selected: i.in_stock, custom: true }))
      ),
    })),
    ...staticCategories,
  ];

  return (
    <div className="pt-2">
      <div className="mb-5 flex items-center gap-3">
        <BackButton href="/mypage" />
        <h1 className="text-[22px] font-bold">{dict.mypage.fridge}</h1>
      </div>
      <FridgeEditor categories={categories} />
    </div>
  );
}
