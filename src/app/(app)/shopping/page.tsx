import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { GlassCard, ProgressBar } from "@/components/ui";
import {
  toggleShoppingItem,
  addShoppingItem,
  deleteShoppingItem,
  setAllShoppingItemsChecked,
} from "@/lib/actions/shopping";
import type { ShoppingItem } from "@/lib/types";
import { FinishShoppingBar } from "./finish-shopping-bar";
import { ClearShoppingListButton } from "./clear-shopping-list-button";
import { ShoppingItemLink } from "./shopping-item-link";

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
    <div className={doneCount > 0 ? "pb-[calc(11.5rem+env(safe-area-inset-bottom))]" : ""}>
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
          <div className="mt-6 mb-4 flex items-center justify-between">
            <ClearShoppingListButton />
            <form action={setAllShoppingItemsChecked}>
              <input type="hidden" name="checked" value={(!allChecked).toString()} />
              <button type="submit" className="px-4 py-2 text-xs font-bold text-accent">
                {allChecked ? "전체 해제" : "전체 선택"}
              </button>
            </form>
          </div>
          <div className="flex flex-col">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 border-b border-border py-3"
            >
              <form action={toggleShoppingItem}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="nextChecked" value={(!item.checked).toString()} />
                <button
                  type="submit"
                  className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border-[1.5px] ${
                    item.checked ? "border-positive bg-positive" : "border-border bg-surface"
                  }`}
                >
                  {item.checked && (
                    <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.5 7.5l3 3 6-7" />
                    </svg>
                  )}
                </button>
              </form>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold">{item.name}</p>
                {item.source_recipe_title && (
                  <p className="mt-0.5 text-[11px] text-ink-faint">
                    {item.source_recipe_title} 재료
                  </p>
                )}
              </div>
              <ShoppingItemLink id={item.id} name={item.name} checked={item.checked} />
              <form action={deleteShoppingItem}>
                <input type="hidden" name="id" value={item.id} />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg bg-surface px-2.5 py-1.5 text-[11px] font-bold text-ink-soft"
                >
                  제거하기
                </button>
              </form>
            </div>
          ))}
          </div>
        </>
      )}

      <FinishShoppingBar doneCount={doneCount} />
    </div>
  );
}
