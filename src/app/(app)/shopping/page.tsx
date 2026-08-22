import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { GlassCard, ProgressBar } from "@/components/ui";
import { addShoppingItem, setAllShoppingItemsChecked } from "@/lib/actions/shopping";
import type { ShoppingItem } from "@/lib/types";
import { FinishShoppingBar } from "./finish-shopping-bar";
import { ClearShoppingListButton } from "./clear-shopping-list-button";
import { ShoppingItemRow } from "./shopping-item-row";

export default async function ShoppingPage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const { data } = await supabase
    .from("shopping_items")
    .select("*")
    .eq("household_id", household!.id)
    // id is the tiebreaker: items added together (e.g. bulk-added from a
    // recipe) share the exact same created_at, and without a second sort key
    // Postgres doesn't guarantee a stable order among ties — the list would
    // visibly reshuffle itself on every reload, including after a checkbox
    // toggle (which just re-fetches the same query).
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });

  const items = (data as ShoppingItem[] | null) ?? [];
  const doneCount = items.filter((i) => i.checked).length;
  const percent = items.length ? (doneCount / items.length) * 100 : 0;
  const allChecked = items.length > 0 && doneCount === items.length;

  return (
    <div className="pb-[calc(11.5rem+env(safe-area-inset-bottom))]">
      <GlassCard className="mb-[18px] bg-white p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[13px] font-bold">이번 장보기</span>
          <span className="text-xs font-bold text-accent">
            {doneCount}/{items.length} 완료
          </span>
        </div>
        <ProgressBar percent={percent} colorClass="bg-accent" />
      </GlassCard>

      <form action={addShoppingItem} className="mb-2 flex gap-2">
        <input
          name="name"
          placeholder="+ 항목 추가"
          className="flex-1 rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white"
        >
          추가
        </button>
      </form>

      {items.length === 0 ? (
        <p className="mt-10 text-center text-sm text-ink-soft">
          장보기 목록이 비어 있어요.
        </p>
      ) : (
        <>
          <div className="mt-6 mb-4 flex items-center justify-end gap-1">
            <form action={setAllShoppingItemsChecked}>
              <input type="hidden" name="checked" value={(!allChecked).toString()} />
              <button type="submit" className="px-4 py-2 text-xs font-bold text-ink-soft">
                {allChecked ? "전체 해제" : "전체 선택"}
              </button>
            </form>
            {allChecked && <ClearShoppingListButton />}
          </div>
          <div className="flex flex-col">
            {items.map((item) => (
              <ShoppingItemRow key={item.id} item={item} />
            ))}
          </div>
        </>
      )}

      <FinishShoppingBar doneCount={doneCount} />
    </div>
  );
}
