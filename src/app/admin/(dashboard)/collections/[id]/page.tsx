import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { CollectionItemsEditor } from "./collection-items-editor";

export type CollectionRecipeItem = {
  source: "creator" | "personal";
  id: string;
  title: string | null;
  subtitle: string | null;
  cover_photo_urls: string[];
  icon_emoji: string | null;
  creator_name: string;
};

export default async function AdminCollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: collection }, { data: items }] = await Promise.all([
    supabase.from("explore_collections").select("id, title, emoji").eq("id", id).maybeSingle(),
    supabase.rpc("get_collection_recipes", { p_collection_id: id }),
  ]);

  if (!collection) {
    return <p className="text-sm text-ink-soft">컬렉션을 찾을 수 없어요.</p>;
  }

  return (
    <div>
      <Link href="/admin/collections" className="mb-3 inline-block text-xs font-bold text-ink-faint">
        ← 컬렉션 목록
      </Link>
      <h1 className="mb-6 text-xl font-bold">
        {collection.emoji ? `${collection.emoji} ` : ""}
        {collection.title}
      </h1>

      <CollectionItemsEditor collectionId={id} items={(items as CollectionRecipeItem[] | null) ?? []} />
    </div>
  );
}
