import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { INGREDIENT_CATEGORIES } from "@/lib/ingredients";
import { FridgeEditor } from "./fridge-editor";
import type { FridgeItem } from "@/lib/types";

const UNCATEGORIZED = "미분류";

export default async function FridgePage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  // Only rows the household actually has — the old version also merged in
  // every name from INGREDIENT_CATEGORIES as an unowned placeholder chip,
  // which just cluttered each category with things nobody added.
  const { data } = await supabase
    .from("fridge_items")
    .select("*")
    .eq("household_id", household!.id)
    .eq("in_stock", true);

  const fridgeItems = (data as FridgeItem[] | null) ?? [];
  const staticNames = new Set(INGREDIENT_CATEGORIES.map((c) => c.name));
  const itemsFor = (name: string) =>
    fridgeItems
      .filter((i) => (i.category ?? UNCATEGORIZED) === name)
      .map((i) => ({ name: i.name, selected: true, custom: true }));

  // 미분류 goes first, not appended after the named categories — it's where
  // a freshly-typed item with no category lands, so it needs to be the
  // thing users see first in order to drag items out of it into a real one.
  const extraCategoryNames = [
    ...new Set(
      fridgeItems
        .map((i) => i.category ?? UNCATEGORIZED)
        .filter((name) => name !== UNCATEGORIZED && !staticNames.has(name))
    ),
  ];

  const categories = [
    { name: UNCATEGORIZED, items: itemsFor(UNCATEGORIZED) },
    ...INGREDIENT_CATEGORIES.map((cat) => ({ name: cat.name, items: itemsFor(cat.name) })),
    ...extraCategoryNames.map((name) => ({ name, items: itemsFor(name) })),
  ];

  return (
    <div>
      <FridgeEditor categories={categories} />
    </div>
  );
}
