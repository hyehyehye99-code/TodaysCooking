import { createAdminClient } from "@/lib/supabase/admin";

type Event = {
  id: string;
  household_id: string;
  event_type: string;
  product_id: string | null;
  price: number | null;
  currency: string | null;
  occurred_at: string;
};

export default async function AdminRevenuePage() {
  const supabase = createAdminClient();
  const [{ data: events }, { data: households }] = await Promise.all([
    supabase.from("subscription_events").select("*").order("occurred_at", { ascending: false }),
    supabase.from("households").select("id, name"),
  ]);

  const householdNameById = new Map(
    ((households as { id: string; name: string }[] | null) ?? []).map((h) => [h.id, h.name])
  );
  const rows = (events as Event[] | null) ?? [];
  const totalsByCurrency = new Map<string, number>();
  for (const r of rows) {
    if (r.price == null) continue;
    const cur = r.currency ?? "KRW";
    totalsByCurrency.set(cur, (totalsByCurrency.get(cur) ?? 0) + r.price);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-xl font-bold">수익 관리</h1>
        <a
          href="/admin/revenue/export"
          className="rounded-xl border border-accent bg-white px-3.5 py-2.5 text-xs font-bold text-accent-ink"
        >
          ⬇ 엑셀로 내보내기
        </a>
      </div>
      <p className="mb-6 text-sm text-ink-soft">
        구독 결제 이벤트를 자동으로 기록해요. 이 기능을 켠 시점 이후의 결제만 쌓여요.
      </p>

      {totalsByCurrency.size > 0 && (
        <div className="mb-6 flex flex-wrap gap-3">
          {[...totalsByCurrency.entries()].map(([cur, total]) => (
            <div key={cur} className="rounded-2xl border border-border bg-white p-5">
              <p className="text-xs font-semibold text-ink-soft">누적 수익 ({cur})</p>
              <p className="mt-2 text-2xl font-bold">{total.toLocaleString("ko-KR")}</p>
            </div>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-ink-soft">아직 기록된 결제 이벤트가 없어요.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs text-ink-soft">
                <th className="px-3 py-2 font-semibold">일시</th>
                <th className="px-3 py-2 font-semibold">우리집</th>
                <th className="px-3 py-2 font-semibold">이벤트</th>
                <th className="px-3 py-2 font-semibold">상품</th>
                <th className="px-3 py-2 text-right font-semibold">금액</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="px-3 py-2 text-ink-soft">{new Date(r.occurred_at).toLocaleString("ko-KR")}</td>
                  <td className="px-3 py-2 font-bold">{householdNameById.get(r.household_id) ?? "-"}</td>
                  <td className="px-3 py-2 text-ink-soft">{r.event_type}</td>
                  <td className="px-3 py-2 text-ink-soft">{r.product_id ?? "-"}</td>
                  <td className="px-3 py-2 text-right">
                    {r.price != null ? `${r.price.toLocaleString("ko-KR")} ${r.currency ?? ""}` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
