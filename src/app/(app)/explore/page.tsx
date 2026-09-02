import { createClient } from "@/lib/supabase/server";
import { ExploreView } from "./explore-view";

export type ExploreCreator = {
  id: string;
  name: string;
  icon_emoji: string | null;
  avatar_url: string | null;
  channel_type: string | null;
  recipe_count: number;
};

export type ExploreFeedItem = {
  source: "creator" | "personal";
  id: string;
  title: string | null;
  subtitle: string | null;
  cover_photo_urls: string[];
  icon_emoji: string | null;
  tags: string[];
  creator_id: string | null;
  creator_name: string;
  creator_icon_emoji: string | null;
  add_count: number;
  created_at: string;
};

export type ExploreCollection = {
  id: string;
  title: string;
  emoji: string | null;
  recipe_count: number;
};

export type ExploreBanner = {
  id: string;
  title: string;
  emoji: string | null;
  link_url: string | null;
};

export default async function ExplorePage() {
  const supabase = await createClient();

  const [{ data: feed }, { data: collections }, { data: banners }] = await Promise.all([
    supabase.rpc("search_explore_recipes", { p_query: null }),
    supabase.rpc("list_explore_collections"),
    supabase.rpc("list_explore_banners"),
  ]);

  const collectionList = (collections as ExploreCollection[] | null) ?? [];
  const collectionRecipes = await Promise.all(
    collectionList.map(async (c) => {
      const { data } = await supabase.rpc("get_collection_recipes", { p_collection_id: c.id });
      return [c.id, (data as ExploreFeedItem[] | null) ?? []] as const;
    })
  );

  return (
    <ExploreView
      feed={(feed as ExploreFeedItem[] | null) ?? []}
      collections={collectionList}
      collectionRecipesById={Object.fromEntries(collectionRecipes)}
      banners={(banners as ExploreBanner[] | null) ?? []}
    />
  );
}
