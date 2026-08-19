import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { GlassCard, ProgressBar } from "@/components/ui";
import {
  toggleShoppingItem,
  addShoppingItem,
  deleteShoppingItem,
  finishShoppingTrip,
} from "@/lib/actions/shopping";
import type { ShoppingItem } from "@/lib/types";

export default async function ShoppingPage() {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const { data } = await supabase
    .from("shopping_items")
    .select("*")
    .eq("household_id", household!.id)
    .order("created_at", { ascending: false });

  const items = (data as ShoppingItem[] | null) ?? [];
  const doneCount = items.filter((i) => i.checked).length;
  const percent = items.length ? (doneCount / items.length) * 100 : 0;

  return (
    <div>
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
                <p className="text-sm font-semibold">{item.name}</p>
                {item.source_recipe_title && (
                  <p className="mt-0.5 text-[11px] text-ink-faint">
                    {item.source_recipe_title} 재료
                  </p>
                )}
              </div>
              <form action={deleteShoppingItem}>
                <input type="hidden" name="id" value={item.id} />
                <button
                  type="submit"
                  aria-label="삭제"
                  className="flex h-6 w-6 shrink-0 items-center justify-center text-ink-faint"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {doneCount > 0 && (
        <form action={finishShoppingTrip} className="mt-6">
          <button
            type="submit"
            className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-white"
          >
            오늘 장보기 끝내기
          </button>
          <p className="mt-2 text-center text-xs text-ink-faint">
            체크한 {doneCount}개 재료가 냉장고로 이동해요
          </p>
        </form>
      )}
    </div>
  );
}
