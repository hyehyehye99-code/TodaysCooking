import { INGREDIENT_CATEGORIES, ALL_KNOWN_INGREDIENTS } from "@/lib/ingredients";

type FridgeRow = { name: string; category: string | null; in_stock: boolean };

function bySelectedFirst<T extends { selected: boolean }>(items: T[]) {
  return [...items].sort((a, b) => Number(b.selected) - Number(a.selected));
}

// Shared by the signed-in fridge page (rows from Supabase) and the guest one
// (rows from localStorage): the built-in categories, plus whatever custom
// ingredients / categories the user has added.
export function buildFridgeCategories(fridgeItems: FridgeRow[]) {
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
  return [
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
}
