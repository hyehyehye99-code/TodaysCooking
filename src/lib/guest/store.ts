// Guest mode: recipes, the shopping list and the fridge live in this device's
// localStorage instead of Supabase, so the app works without an account.
// Everything here mirrors what the server actions do for a signed-in
// household (see lib/actions/recipes.ts, shopping.ts, fridge.ts) — same
// rules, just against a local JSON blob. On login, GuestMigrator moves it all
// into the user's new household and clears it.

import { useSyncExternalStore } from "react";
import { CATEGORY_BY_INGREDIENT_NAME } from "@/lib/ingredients";
import type { RecipeWithIngredients } from "@/lib/types";

export type GuestIngredient = { name: string; amount: string | null; skipped: boolean };
export type GuestReference = {
  url: string;
  title: string | null;
  domain: string | null;
  thumbnail_url: string | null;
};
export type GuestRecipe = {
  id: string;
  title: string | null;
  subtitle: string | null;
  icon_emoji: string | null;
  tags: string[];
  notes: string | null;
  cover_photo_urls: string[]; // data: URLs (downscaled) — see recipe-input.ts
  hide_ingredients: boolean;
  is_favorite: boolean;
  is_cooking: boolean;
  position: number | null;
  created_at: string;
  ingredients: GuestIngredient[];
  reference: GuestReference | null;
};
export type GuestShoppingItem = {
  id: string;
  name: string;
  checked: boolean;
  source_recipe_title: string | null;
  created_at: string;
};
export type GuestFridgeItem = { name: string; category: string; in_stock: boolean };

export type GuestData = {
  v: 1;
  recipes: GuestRecipe[];
  shopping: GuestShoppingItem[];
  fridge: GuestFridgeItem[];
};

export type IngredientChipState = "none" | "fridge" | "shopping" | "skip";

const STORAGE_KEY = "recipeing.guest.v1";
const EMPTY: GuestData = { v: 1, recipes: [], shopping: [], fridge: [] };

let cache: GuestData | null = null;
const listeners = new Set<() => void>();

function isGuestData(value: unknown): value is GuestData {
  const v = value as GuestData | null;
  return !!v && v.v === 1 && Array.isArray(v.recipes) && Array.isArray(v.shopping) && Array.isArray(v.fridge);
}

// Never throws: localStorage can be missing/blocked (private mode, disabled
// storage) or hold something unreadable — either way the app just behaves
// like a fresh guest.
function read(): GuestData {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    cache = isGuestData(parsed) ? parsed : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function emit() {
  listeners.forEach((l) => l());
}

// Returns false (and leaves the previous data untouched) when the browser
// refuses the write — in practice the ~5MB localStorage quota, which photos
// are what would blow through.
function commit(next: GuestData): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return false;
  }
  cache = next;
  emit();
  return true;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab of the same origin changed the data.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

// `ready` is false during SSR and the hydration pass, so a guest doesn't get a
// flash of the empty state before their saved data has been read.
export function useGuestData(): { data: GuestData; ready: boolean } {
  const data = useSyncExternalStore(subscribe, read, () => EMPTY);
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  return { data, ready };
}

export function getGuestData(): GuestData {
  return read();
}

export function hasGuestData(): boolean {
  const d = read();
  return d.recipes.length > 0 || d.shopping.length > 0 || d.fridge.length > 0;
}

export function clearGuestData() {
  cache = EMPTY;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing to clear
  }
  emit();
}

function newId() {
  return `g_${crypto.randomUUID()}`;
}

export function isGuestRecipeId(id: string) {
  return id.startsWith("g_");
}

// ---------- recipes ----------

// Same ordering the server list uses: cooking first, then manual position
// (nulls last), then newest.
export function sortRecipes(recipes: GuestRecipe[]): GuestRecipe[] {
  return [...recipes].sort((a, b) => {
    if (a.is_cooking !== b.is_cooking) return a.is_cooking ? -1 : 1;
    const ap = a.position ?? Number.POSITIVE_INFINITY;
    const bp = b.position ?? Number.POSITIVE_INFINITY;
    if (ap !== bp) return ap - bp;
    return b.created_at.localeCompare(a.created_at);
  });
}

// Lets the existing RecipeList / detail components render a guest recipe
// without knowing it's local.
export function toRecipeWithIngredients(g: GuestRecipe): RecipeWithIngredients {
  return {
    id: g.id,
    household_id: "guest",
    title: g.title,
    subtitle: g.subtitle,
    cook_time_minutes: null,
    cover_photo_urls: g.cover_photo_urls,
    icon_emoji: g.icon_emoji,
    tags: g.tags,
    notes: g.notes,
    position: g.position,
    is_favorite: g.is_favorite,
    is_cooking: g.is_cooking,
    hide_ingredients: g.hide_ingredients,
    created_by: "guest",
    created_at: g.created_at,
    recipe_ingredients: g.ingredients.map((ing, i) => ({
      id: `${g.id}:${i}`,
      recipe_id: g.id,
      name: ing.name,
      amount: ing.amount,
      position: i,
      skipped: ing.skipped,
    })),
    bookmarks: g.reference
      ? [
          {
            url: g.reference.url,
            title: g.reference.title,
            domain: g.reference.domain,
            thumbnail_url: g.reference.thumbnail_url,
          },
        ]
      : [],
  };
}

export type GuestRecipeInput = Omit<
  GuestRecipe,
  "id" | "position" | "created_at" | "is_favorite" | "is_cooking"
>;

export function addRecipe(input: GuestRecipeInput): { ok: true; id: string } | { ok: false } {
  const d = read();
  // One below the current lowest position — puts the new recipe at the top of
  // the list without renumbering the rest (same trick as createRecipe).
  const lowest = d.recipes.reduce<number>((min, r) => Math.min(min, r.position ?? 0), 0);
  const recipe: GuestRecipe = {
    ...input,
    id: newId(),
    position: lowest - 1,
    created_at: new Date().toISOString(),
    is_favorite: false,
    is_cooking: false,
  };
  return commit({ ...d, recipes: [recipe, ...d.recipes] }) ? { ok: true, id: recipe.id } : { ok: false };
}

export function updateRecipe(id: string, input: GuestRecipeInput): boolean {
  const d = read();
  if (!d.recipes.some((r) => r.id === id)) return false;
  return commit({ ...d, recipes: d.recipes.map((r) => (r.id === id ? { ...r, ...input } : r)) });
}

function patchRecipe(id: string, patch: Partial<GuestRecipe>) {
  const d = read();
  commit({ ...d, recipes: d.recipes.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
}

export function toggleFavorite(id: string, next: boolean) {
  patchRecipe(id, { is_favorite: next });
}

export function toggleCooking(id: string, next: boolean) {
  patchRecipe(id, { is_cooking: next });
}

export function deleteRecipes(ids: string[]) {
  const drop = new Set(ids);
  const d = read();
  commit({ ...d, recipes: d.recipes.filter((r) => !drop.has(r.id)) });
}

export function reorderRecipes(order: string[]) {
  const positions = new Map(order.map((id, i) => [id, i]));
  const d = read();
  commit({
    ...d,
    recipes: d.recipes.map((r) => (positions.has(r.id) ? { ...r, position: positions.get(r.id)! } : r)),
  });
}

// Mirrors setIngredientState() in lib/actions/recipes.ts: one ingredient's
// chip state decides its fridge stock and whether it sits on the shopping
// list. "skip" only marks it unneeded for this recipe and leaves stock alone.
export function setIngredientStates(recipeId: string, entries: [string, IngredientChipState][]) {
  const d = read();
  const recipe = d.recipes.find((r) => r.id === recipeId);
  if (!recipe) return;

  let recipes = d.recipes;
  let fridge = d.fridge;
  let shopping = d.shopping;

  for (const [name, state] of entries) {
    recipes = recipes.map((r) =>
      r.id === recipeId
        ? { ...r, ingredients: r.ingredients.map((ing) => (ing.name === name ? { ...ing, skipped: state === "skip" } : ing)) }
        : r
    );

    if (state !== "skip") {
      const category = CATEGORY_BY_INGREDIENT_NAME.get(name) ?? "미분류";
      const inStock = state === "fridge";
      fridge = fridge.some((f) => f.name === name)
        ? fridge.map((f) => (f.name === name ? { ...f, in_stock: inStock } : f))
        : [...fridge, { name, category, in_stock: inStock }];
    }

    if (state === "shopping") {
      const title = recipe.title;
      const existing = shopping.find((s) => s.name === name);
      if (!existing) {
        shopping = [
          ...shopping,
          { id: newId(), name, checked: false, source_recipe_title: title, created_at: new Date().toISOString() },
        ];
      } else if (title) {
        const titles = (existing.source_recipe_title ?? "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        if (!titles.includes(title)) {
          shopping = shopping.map((s) =>
            s.name === name ? { ...s, source_recipe_title: [...titles, title].join(", ") } : s
          );
        }
      }
    } else {
      shopping = shopping.filter((s) => s.name !== name);
    }
  }

  commit({ ...d, recipes, fridge, shopping });
}

// ---------- shopping ----------

export function addShoppingItem(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const d = read();
  commit({
    ...d,
    shopping: [
      ...d.shopping,
      { id: newId(), name: trimmed, checked: false, source_recipe_title: null, created_at: new Date().toISOString() },
    ],
  });
}

export function setShoppingChecked(id: string, checked: boolean) {
  const d = read();
  commit({ ...d, shopping: d.shopping.map((s) => (s.id === id ? { ...s, checked } : s)) });
}

export function setAllShoppingChecked(checked: boolean) {
  const d = read();
  commit({ ...d, shopping: d.shopping.map((s) => ({ ...s, checked })) });
}

export function clearAllShopping() {
  commit({ ...read(), shopping: [] });
}

export function clearCheckedShopping() {
  const d = read();
  commit({ ...d, shopping: d.shopping.filter((s) => !s.checked) });
}

// Checked items move into the fridge as in-stock, then leave the list.
export function finishShoppingTrip() {
  const d = read();
  const checked = d.shopping.filter((s) => s.checked);
  if (checked.length === 0) return;

  let fridge = d.fridge;
  for (const item of checked) {
    const category = CATEGORY_BY_INGREDIENT_NAME.get(item.name) ?? "미분류";
    fridge = fridge.some((f) => f.name === item.name)
      ? fridge.map((f) => (f.name === item.name ? { ...f, in_stock: true } : f))
      : [...fridge, { name: item.name, category, in_stock: true }];
  }
  commit({ ...d, fridge, shopping: d.shopping.filter((s) => !s.checked) });
}

// ---------- fridge ----------

export function saveFridge(items: { name: string; category: string; inStock: boolean }[], toDelete: string[] = []) {
  const d = read();
  const removed = new Set(toDelete);
  let fridge = d.fridge.filter((f) => !removed.has(f.name));
  for (const item of items) {
    const next = { name: item.name, category: item.category, in_stock: item.inStock };
    fridge = fridge.some((f) => f.name === item.name)
      ? fridge.map((f) => (f.name === item.name ? next : f))
      : [...fridge, next];
  }
  commit({ ...d, fridge });
}
