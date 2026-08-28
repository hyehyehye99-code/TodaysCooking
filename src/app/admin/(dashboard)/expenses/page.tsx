import { createAdminClient } from "@/lib/supabase/admin";
import { ExpenseForm } from "./expense-form";
import { DeleteExpenseButton } from "./delete-expense-button";
import { RecurringExpenseForm } from "./recurring-expense-form";
import { RecurringExpensesList, type RecurringExpense } from "./recurring-expenses-list";

type Expense = {
  id: string;
  category: string;
  amount: number;
  memo: string | null;
  spent_at: string;
  recurring_expense_id: string | null;
};

export default async function AdminExpensesPage() {
  const supabase = createAdminClient();
  const [{ data }, { data: recurring }] = await Promise.all([
    supabase.from("expenses").select("*").order("spent_at", { ascending: false }),
    supabase.from("recurring_expenses").select("*").order("created_at", { ascending: false }),
  ]);
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

      <p className="mb-2 text-sm font-bold">정기 지출</p>
      <div className="mb-3">
        <RecurringExpenseForm />
      </div>
      <div className="mb-8">
        <RecurringExpensesList items={(recurring as RecurringExpense[] | null) ?? []} />
      </div>

      <p className="mb-2 text-sm font-bold">지출 내역</p>
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
                  <td className="px-3 py-2">
                    <span className="font-bold">{r.category}</span>
                    {r.recurring_expense_id && (
                      <span className="ml-1.5 rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-bold text-ink-faint">
                        정기
                      </span>
                    )}
                  </td>
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
