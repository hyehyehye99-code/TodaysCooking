import { createClient } from "@/lib/supabase/server";
import { ExploreView } from "./explore-view";

export type ExploreCreator = {
  id: string;
  name: string;
  icon_emoji: string | null;
  avatar_url: string | null;
  type: string | null;
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

export default async function ExplorePage() {
  const supabase = await createClient();

  const [{ data: creators }, { data: feed }] = await Promise.all([
    supabase.rpc("list_creators"),
    supabase.rpc("search_explore_recipes", { p_query: null }),
  ]);

  return (
    <ExploreView
      creators={(creators as ExploreCreator[] | null) ?? []}
      feed={(feed as ExploreFeedItem[] | null) ?? []}
    />
  );
}
