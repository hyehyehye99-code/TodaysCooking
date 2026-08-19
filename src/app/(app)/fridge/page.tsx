import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { INGREDIENT_CATEGORIES, ALL_KNOWN_INGREDIENTS } from "@/lib/ingredients";
import { FridgeEditor } from "./fridge-editor";
import type { FridgeItem } from "@/lib/types";

function bySelectedFirst<T extends { selected: boolean }>(items: T[]) {
  return [...items].sort((a, b) => Number(b.selected) - Number(a.selected));
}

export default async function FridgePage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const { data } = await supabase
    .from("fridge_items")
    .select("*")
    .eq("household_id", household!.id);

  const fridgeItems = (data as FridgeItem[] | null) ?? [];
  const stock = new Map(fridgeItems.map((i) => [i.name, i.in_stock]));

  const customItems = fridgeItems.filter((i) => !ALL_KNOWN_INGREDIENTS.has(i.name));
  const staticNames = new Set(INGREDIENT_CATEGORIES.map((c) => c.name));

  const categories = INGREDIENT_CATEGORIES.map((cat) => ({
    name: cat.name,
    items: bySelectedFirst([
      ...cat.items.map((name) => ({ name, selected: !!stock.get(name), custom: false })),
      ...customItems
        .filter((i) => (i.category ?? "기타") === cat.name)
        .map((i) => ({ name: i.name, selected: i.in_stock, custom: true })),
    ]),
  }));

  const extraCategoryNames = [
    ...new Set(
      customItems
        .map((i) => i.category ?? "기타")
        .filter((name) => !staticNames.has(name))
    ),
  ];
  for (const name of extraCategoryNames) {
    categories.push({
      name,
      items: bySelectedFirst(
        customItems
          .filter((i) => (i.category ?? "기타") === name)
          .map((i) => ({ name: i.name, selected: i.in_stock, custom: true }))
      ),
    });
  }

  return (
    <div>
      <FridgeEditor categories={categories} />
    </div>
  );
}
