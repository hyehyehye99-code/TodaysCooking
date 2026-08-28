import { createClient } from "@/lib/supabase/server";
import { ExploreView } from "./explore-view";

export type ExploreCreator = {
  id: string;
  name: string;
  icon_emoji: string | null;
  avatar_url: string | null;
  recipe_count: number;
};

export type ExplorePublicRecipe = {
  id: string;
  title: string | null;
  subtitle: string | null;
  cover_photo_urls: string[];
  icon_emoji: string | null;
  tags: string[];
  creator_name: string;
  creator_icon_emoji: string | null;
};

export default async function ExplorePage() {
  const supabase = await createClient();

  const [{ data: creators }, { data: publicRecipes }] = await Promise.all([
    supabase.rpc("list_creators"),
    supabase.rpc("list_public_recipes"),
  ]);

  return (
    <ExploreView
      creators={(creators as ExploreCreator[] | null) ?? []}
      publicRecipes={(publicRecipes as ExplorePublicRecipe[] | null) ?? []}
    />
  );
}
