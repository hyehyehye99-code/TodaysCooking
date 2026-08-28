import { createAdminClient } from "@/lib/supabase/admin";
import { NewPromoCodeForm } from "./new-promo-code-form";
import { PromoCodesTable } from "./promo-codes-table";
import { PromoGrantPanel } from "./promo-grant-panel";
import { PromoRedemptionsTable } from "./promo-redemptions-table";

export type PromoCode = {
  code: string;
  note: string | null;
  active: boolean;
  duration_days: number | null;
  created_at: string;
};

export type PromoRedemption = {
  user_id: string;
  code: string;
  redeemed_at: string;
  expires_at: string | null;
  granted_by: string;
};

export type PromoUser = { id: string; nickname: string | null; email: string | null };

export default async function AdminPromotionsPage() {
  const supabase = createAdminClient();
  const [{ data: codes }, { data: redemptions }, { data: usersData }, { data: profiles }] = await Promise.all([
    supabase.from("promo_codes").select("*").order("created_at", { ascending: false }),
    supabase.from("promo_code_redemptions").select("*").order("redeemed_at", { ascending: false }),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from("profiles").select("id, nickname"),
  ]);

  const nicknameById = new Map(
    ((profiles as { id: string; nickname: string }[] | null) ?? []).map((p) => [p.id, p.nickname])
  );
  const users: PromoUser[] = usersData.users.map((u) => ({
    id: u.id,
    nickname: nicknameById.get(u.id) ?? null,
    email: u.email ?? null,
  }));

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">프로모션 코드 관리</h1>
      <p className="mb-6 text-sm text-ink-soft">
        코드를 만들고, 유저에게 직접 지급하거나 유저가 앱에서 입력한 코드를 확인·회수할 수 있어요.
      </p>

      <div className="mb-8 rounded-2xl border border-border bg-white p-4">
        <p className="mb-3 text-sm font-bold">새 코드 만들기</p>
        <NewPromoCodeForm />
      </div>

      <p className="mb-2 text-sm font-bold">코드 목록 ({(codes ?? []).length})</p>
      <div className="mb-8">
        <PromoCodesTable
          codes={(codes as PromoCode[] | null) ?? []}
          redemptionCountByCode={((redemptions as PromoRedemption[] | null) ?? []).reduce<Record<string, number>>(
            (acc, r) => {
              acc[r.code] = (acc[r.code] ?? 0) + 1;
              return acc;
            },
            {}
          )}
        />
      </div>

      <p className="mb-2 text-sm font-bold">유저에게 직접 지급</p>
      <div className="mb-8">
        <PromoGrantPanel
          users={users}
          codes={((codes as PromoCode[] | null) ?? []).filter((c) => c.active)}
        />
      </div>

      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold">지급된 프로모션 ({(redemptions ?? []).length})</p>
        <a
          href="/admin/promotions/export"
          className="rounded-xl border border-accent bg-white px-3.5 py-2.5 text-xs font-bold text-accent-ink"
        >
          ⬇ 엑셀로 내보내기
        </a>
      </div>
      <PromoRedemptionsTable redemptions={(redemptions as PromoRedemption[] | null) ?? []} users={users} />
    </div>
  );
}
