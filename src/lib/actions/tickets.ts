"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TicketKind, TicketOrder } from "@/lib/tickets";

function refresh() {
  revalidatePath("/mypage/usage");
  revalidatePath("/mypage");
  revalidatePath("/assistant");
}

export async function redeemResetTicket(kind: TicketKind): Promise<{ ok: true } | { ok: false; error: string }> {
  if (kind !== "full" && kind !== "half") return { ok: false, error: "잘못된 요청이에요." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("use_reset_ticket", { p_kind: kind });
  if (error) {
    return {
      ok: false,
      error: error.message.includes("nothing_to_reset")
        ? "초기화할 사용량이 없어요."
        : "티켓을 사용하지 못했어요. 잠시 후 다시 시도해주세요.",
    };
  }
  if (data === null) return { ok: false, error: "사용할 수 있는 티켓이 없어요." };

  refresh();
  return { ok: true };
}

export async function saveUsageSettings(input: {
  autoUse: boolean;
  order: TicketOrder;
}): Promise<{ ok: boolean }> {
  if (input.order !== "half_first" && input.order !== "full_first") return { ok: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.from("ai_usage_settings").upsert({
    user_id: user.id,
    auto_use_tickets: !!input.autoUse,
    ticket_order: input.order,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false };

  refresh();
  return { ok: true };
}
