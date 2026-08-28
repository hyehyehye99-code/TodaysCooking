export type Recipe = {
  id: string;
  household_id: string;
  // Optional: a recipe created with just a reference link and nothing else
  // (the recipes-tab equivalent of the old standalone bookmark) has no
  // title — see RecipeList/RecipeDetailPage for how that renders.
  title: string | null;
  subtitle: string | null;
  cook_time_minutes: number | null;
  cover_photo_urls: string[];
  icon_emoji: string | null;
  tags: string[];
  notes: string | null;
  position: number | null;
  is_favorite: boolean;
  hide_ingredients: boolean;
  created_by: string;
  created_at: string;
};

export type RecipeIngredient = {
  id: string;
  recipe_id: string;
  name: string;
  amount: string | null;
  position: number;
  skipped: boolean;
};

export type RecipeWithIngredients = Recipe & {
  recipe_ingredients: RecipeIngredient[];
  bookmarks?: { url: string; title: string | null; domain: string | null; thumbnail_url: string | null }[];
};

export type RecipeCookLog = {
  id: string;
  household_id: string;
  recipe_id: string;
  photo_url: string | null;
  cooked_at: string;
  rating: number | null;
  created_at: string;
};

export type FridgeItem = {
  id: string;
  household_id: string;
  name: string;
  category: string | null;
  in_stock: boolean;
  updated_at: string;
};

export type Bookmark = {
  id: string;
  household_id: string;
  url: string;
  title: string | null;
  domain: string | null;
  thumbnail_url: string | null;
  recipe_id: string | null;
  note: string | null;
  tags: string[];
  position: number | null;
  is_favorite: boolean;
  created_by: string;
  created_at: string;
};

export type ShoppingItem = {
  id: string;
  household_id: string;
  name: string;
  source_recipe_id: string | null;
  source_recipe_title: string | null;
  checked: boolean;
  created_at: string;
};
