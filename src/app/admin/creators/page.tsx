import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminLogout } from "@/lib/actions/admin";
import { NewCreatorForm } from "./new-creator-form";

type Creator = {
  id: string;
  name: string;
  icon_emoji: string | null;
  channel_type: string | null;
  recipe_count: number;
};

export default async function AdminCreatorsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const supabase = createAdminClient();
  const { data } = await supabase.rpc("list_creators");
  const creators = (data as Creator[] | null) ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">크리에이터 관리</h1>
        <div className="flex items-center gap-4">
          <Link href="/admin/import" className="text-xs font-bold text-accent-ink">
            엑셀로 대량 등록
          </Link>
          <form action={adminLogout}>
            <button type="submit" className="text-xs font-semibold text-ink-faint underline">
              로그아웃
            </button>
          </form>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-border bg-white p-4">
        <p className="mb-3 text-sm font-bold">새 크리에이터</p>
        <NewCreatorForm />
      </div>

      <p className="mb-2 text-sm font-bold">크리에이터 목록 ({creators.length})</p>
      {creators.length === 0 ? (
        <p className="text-sm text-ink-soft">아직 등록된 크리에이터가 없어요.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs text-ink-soft">
                <th className="w-10 px-3 py-2 font-semibold" />
                <th className="px-3 py-2 font-semibold">이름</th>
                <th className="px-3 py-2 font-semibold">채널 종류</th>
                <th className="px-3 py-2 text-right font-semibold">레시피 수</th>
              </tr>
            </thead>
            <tbody>
              {creators.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="px-3 py-2 text-lg">{c.icon_emoji ?? "👤"}</td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/creators/${c.id}`} className="font-bold text-ink underline-offset-2 hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-ink-soft">{c.channel_type ?? "-"}</td>
                  <td className="px-3 py-2 text-right text-ink-soft">{c.recipe_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
