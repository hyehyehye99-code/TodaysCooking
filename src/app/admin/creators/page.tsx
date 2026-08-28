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
        <form action={adminLogout}>
          <button type="submit" className="text-xs font-semibold text-ink-faint underline">
            로그아웃
          </button>
        </form>
      </div>

      <div className="mb-8 rounded-2xl border border-border bg-white p-4">
        <p className="mb-3 text-sm font-bold">새 크리에이터</p>
        <NewCreatorForm />
      </div>

      <p className="mb-2 text-sm font-bold">크리에이터 목록 ({creators.length})</p>
      {creators.length === 0 ? (
        <p className="text-sm text-ink-soft">아직 등록된 크리에이터가 없어요.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {creators.map((c) => (
            <Link
              key={c.id}
              href={`/admin/creators/${c.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3"
            >
              <span className="text-xl">{c.icon_emoji ?? "👤"}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{c.name}</p>
                <p className="text-xs text-ink-soft">
                  {c.channel_type ?? "채널 종류 없음"} · 레시피 {c.recipe_count}개
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
