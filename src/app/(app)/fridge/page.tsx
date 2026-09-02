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

  const [{ data }, { data: hiddenRows }] = await Promise.all([
    supabase.from("fridge_items").select("*").eq("household_id", household!.id),
    supabase.from("fridge_hidden_ingredients").select("name").eq("household_id", household!.id),
  ]);

  const fridgeItems = (data as FridgeItem[] | null) ?? [];
  const stock = new Map(fridgeItems.map((i) => [i.name, i.in_stock]));

  // Hidden via 마이페이지 > 냉장고 재료 관리 — dropped from the preset catalog
  // below unless the household actually has it in stock right now, so
  // hiding a preset never makes something you actually own disappear.
  const hidden = new Set((hiddenRows ?? []).map((r) => r.name as string));

  const customItems = fridgeItems.filter((i) => !ALL_KNOWN_INGREDIENTS.has(i.name));
  const staticNames = new Set(INGREDIENT_CATEGORIES.map((c) => c.name));

  const staticCategories = INGREDIENT_CATEGORIES.map((cat) => ({
    name: cat.name,
    items: bySelectedFirst([
      ...cat.items
        .filter((name) => !hidden.has(name) || stock.get(name))
        .map((name) => ({ name, selected: !!stock.get(name), custom: false })),
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
    <div>
      <FridgeEditor categories={categories} />
    </div>
  );
}
