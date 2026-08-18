export type GuestRecipe = {
  id: string;
  title: string;
  subtitle: string;
  cookTimeMinutes: number | null;
  ingredients: string[];
};

export type GuestBookmark = {
  id: string;
  url: string;
  title: string | null;
  domain: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
};

export type GuestShoppingItem = {
  id: string;
  name: string;
  checked: boolean;
  sourceRecipeTitle: string | null;
};

export type GuestData = {
  recipes: GuestRecipe[];
  fridge: Record<string, boolean>;
  bookmarks: GuestBookmark[];
  shopping: GuestShoppingItem[];
};

export const GUEST_LIMITS = {
  recipes: 5,
  bookmarks: 5,
  shopping: 15,
  fridgeCustom: 10,
};

const STORAGE_KEY = "dulUiBueokGuestData";

const EMPTY_DATA: GuestData = { recipes: [], fridge: {}, bookmarks: [], shopping: [] };

export function loadGuestData(): GuestData {
  if (typeof window === "undefined") return EMPTY_DATA;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DATA;
    const parsed = JSON.parse(raw);
    return { ...EMPTY_DATA, ...parsed };
  } catch {
    return EMPTY_DATA;
  }
}

export function saveGuestData(data: GuestData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function hasGuestData(data: GuestData) {
  return (
    data.recipes.length > 0 ||
    Object.values(data.fridge).some(Boolean) ||
    data.bookmarks.length > 0 ||
    data.shopping.length > 0
  );
}

export function clearGuestData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}
