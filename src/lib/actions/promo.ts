"use server";

import { createClient } from "@/lib/supabase/server";

export async function redeemPromoCode(code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = code.trim();
  if (!trimmed) return { ok: false, error: "코드를 입력해주세요." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요해요." };

  const { error } = await supabase.rpc("redeem_promo_code", { p_code: trimmed });
  if (error) return { ok: false, error: "코드가 올바르지 않아요." };
  return { ok: true };
}
