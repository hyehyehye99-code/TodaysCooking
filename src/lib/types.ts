export type Recipe = {
  id: string;
  household_id: string;
  title: string;
  subtitle: string | null;
  cook_time_minutes: number | null;
  cover_photo_url: string | null;
  icon_emoji: string | null;
  tags: string[];
  notes: string | null;
  position: number | null;
  is_favorite: boolean;
  created_by: string;
  created_at: string;
};

export type RecipeIngredient = {
  id: string;
  recipe_id: string;
  name: string;
  position: number;
};

export type RecipeWithIngredients = Recipe & {
  recipe_ingredients: RecipeIngredient[];
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
