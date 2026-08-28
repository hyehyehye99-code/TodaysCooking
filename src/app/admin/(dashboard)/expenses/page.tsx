import { createAdminClient } from "@/lib/supabase/admin";
import { ExpenseForm } from "./expense-form";
import { DeleteExpenseButton } from "./delete-expense-button";

type Expense = { id: string; category: string; amount: number; memo: string | null; spent_at: string };

export default async function AdminExpensesPage() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("expenses").select("*").order("spent_at", { ascending: false });
  const rows = (data as Expense[] | null) ?? [];
  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">지출 관리</h1>
          <p className="mt-1 text-sm text-ink-soft">누적 지출 {total.toLocaleString("ko-KR")}원</p>
        </div>
        <a
          href="/admin/expenses/export"
          className="rounded-xl border border-accent bg-white px-3.5 py-2.5 text-xs font-bold text-accent-ink"
        >
          ⬇ 엑셀로 내보내기
        </a>
      </div>

      <div className="mb-6">
        <ExpenseForm />
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-soft">등록된 지출이 없어요.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs text-ink-soft">
                <th className="px-3 py-2 font-semibold">날짜</th>
                <th className="px-3 py-2 font-semibold">카테고리</th>
                <th className="px-3 py-2 text-right font-semibold">금액</th>
                <th className="px-3 py-2 font-semibold">메모</th>
                <th className="w-14 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="px-3 py-2 text-ink-soft">{r.spent_at}</td>
                  <td className="px-3 py-2 font-bold">{r.category}</td>
                  <td className="px-3 py-2 text-right">{r.amount.toLocaleString("ko-KR")}원</td>
                  <td className="max-w-[240px] truncate px-3 py-2 text-ink-soft">{r.memo}</td>
                  <td className="px-3 py-2 text-right">
                    <DeleteExpenseButton expenseId={r.id} />
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
