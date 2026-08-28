import { createAdminClient } from "@/lib/supabase/admin";

type Sub = {
  household_id: string;
  active: boolean;
  product_id: string | null;
  expires_at: string | null;
  updated_at: string;
};

export default async function AdminSubscriptionsPage() {
  const supabase = createAdminClient();
  const [{ data: subs }, { data: households }, { data: members }, { data: profiles }] = await Promise.all([
    supabase.from("household_subscriptions").select("*").order("updated_at", { ascending: false }),
    supabase.from("households").select("id, name"),
    supabase.from("household_members").select("household_id, user_id"),
    supabase.from("profiles").select("id, nickname"),
  ]);

  const householdNameById = new Map(
    ((households as { id: string; name: string }[] | null) ?? []).map((h) => [h.id, h.name])
  );
  const nicknameById = new Map(
    ((profiles as { id: string; nickname: string }[] | null) ?? []).map((p) => [p.id, p.nickname])
  );
  const membersByHousehold = new Map<string, string[]>();
  for (const m of (members as { household_id: string; user_id: string }[] | null) ?? []) {
    const list = membersByHousehold.get(m.household_id) ?? [];
    list.push(nicknameById.get(m.user_id) ?? "알 수 없음");
    membersByHousehold.set(m.household_id, list);
  }

  const list = (subs as Sub[] | null) ?? [];
  const active = list.filter((s) => s.active);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">구독 사용자 리스트</h1>
          <p className="mt-1 text-sm text-ink-soft">활성 구독 {active.length}건 · 전체 {list.length}건</p>
        </div>
        <a
          href="/admin/subscriptions/export"
          className="rounded-xl border border-accent bg-white px-3.5 py-2.5 text-xs font-bold text-accent-ink"
        >
          ⬇ 엑셀로 내보내기
        </a>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-ink-soft">구독 내역이 없어요.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs text-ink-soft">
                <th className="px-3 py-2 font-semibold">우리집</th>
                <th className="px-3 py-2 font-semibold">멤버</th>
                <th className="px-3 py-2 font-semibold">상태</th>
                <th className="px-3 py-2 font-semibold">상품</th>
                <th className="px-3 py-2 font-semibold">만료일</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.household_id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="px-3 py-2 font-bold">{householdNameById.get(s.household_id) ?? "-"}</td>
                  <td className="px-3 py-2 text-ink-soft">{(membersByHousehold.get(s.household_id) ?? []).join(", ")}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        s.active ? "bg-positive/10 text-positive-ink" : "bg-surface text-ink-faint"
                      }`}
                    >
                      {s.active ? "활성" : "만료"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-ink-soft">{s.product_id ?? "-"}</td>
                  <td className="px-3 py-2 text-ink-soft">
                    {s.expires_at ? new Date(s.expires_at).toLocaleDateString("ko-KR") : "-"}
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
