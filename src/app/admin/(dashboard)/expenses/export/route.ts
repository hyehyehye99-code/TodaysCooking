import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminForExport, xlsxResponse } from "@/lib/admin-export";

export async function GET() {
  const unauthorized = await requireAdminForExport();
  if (unauthorized) return unauthorized;

  const supabase = createAdminClient();
  const { data } = await supabase.from("expenses").select("*").order("spent_at", { ascending: false });

  type Expense = {
    category: string;
    amount: number;
    memo: string | null;
    spent_at: string;
    recurring_expense_id: string | null;
  };
  const rows = ((data as Expense[] | null) ?? []).map((r) => ({
    날짜: r.spent_at,
    카테고리: r.category,
    금액: r.amount,
    메모: r.memo ?? "",
    정기여부: r.recurring_expense_id ? "정기" : "",
  }));

  return xlsxResponse(rows, "expenses.xlsx");
}
