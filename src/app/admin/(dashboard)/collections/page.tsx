import { createAdminClient } from "@/lib/supabase/admin";
import { CollectionList } from "./collection-list";
import { BannerList } from "./banner-list";

export type Collection = {
  id: string;
  title: string;
  emoji: string | null;
  active: boolean;
  position: number;
};

export type Banner = {
  id: string;
  title: string;
  emoji: string | null;
  link_url: string | null;
  image_url: string | null;
  active: boolean;
  position: number;
};

export default async function AdminCollectionsPage() {
  const supabase = createAdminClient();
  const [{ data: collections }, { data: items }, { data: banners }] = await Promise.all([
    supabase.from("explore_collections").select("*").order("position", { ascending: true }),
    supabase.from("explore_collection_items").select("collection_id"),
    supabase.from("explore_banners").select("*").order("position", { ascending: true }),
  ]);

  const countByCollection = ((items as { collection_id: string }[] | null) ?? []).reduce<Record<string, number>>(
    (acc, i) => {
      acc[i.collection_id] = (acc[i.collection_id] ?? 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">탐색 큐레이션 관리</h1>
      <p className="mb-6 text-sm text-ink-soft">
        테마 컬렉션과 배너를 만들어 탐색 탭 상단에 노출해요. 컬렉션 안 레시피는 각 컬렉션에서 검색해서 담아요.
      </p>

      <p className="mb-2 text-sm font-bold">컬렉션 ({(collections ?? []).length})</p>
      <div className="mb-8">
        <CollectionList
          collections={(collections as Collection[] | null) ?? []}
          recipeCountById={countByCollection}
        />
      </div>

      <p className="mb-2 text-sm font-bold">배너 ({(banners ?? []).length})</p>
      <BannerList banners={(banners as Banner[] | null) ?? []} />
    </div>
  );
}
