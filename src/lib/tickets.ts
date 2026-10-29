import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type TicketKind = "full" | "half";
export type TicketOrder = "half_first" | "full_first";

export type UsageSettings = { autoUse: boolean; order: TicketOrder };

export type TicketEvent = {
  id: string;
  kind: TicketKind;
  type: "earned" | "used";
  source: "referral_inviter" | "referral_invitee" | "admin";
  at: string;
};

export type TicketSummary = {
  full: number;
  half: number;
  history: TicketEvent[];
};

const HISTORY_LIMIT = 20;

export async function getTicketSummary(supabase: Supabase, userId: string): Promise<TicketSummary> {
  const { data } = await supabase
    .from("reset_tickets")
    .select("id, kind, source, created_at, used_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = data ?? [];

  const history: TicketEvent[] = rows.flatMap((r) => {
    const base = { id: r.id, kind: r.kind as TicketKind, source: r.source as TicketEvent["source"] };
    return [
      { ...base, type: "earned" as const, at: r.created_at },
      ...(r.used_at ? [{ ...base, id: `${r.id}-used`, type: "used" as const, at: r.used_at }] : []),
    ];
  });
  history.sort((a, b) => b.at.localeCompare(a.at));

  return {
    full: rows.filter((r) => r.kind === "full" && !r.used_at).length,
    half: rows.filter((r) => r.kind === "half" && !r.used_at).length,
    history: history.slice(0, HISTORY_LIMIT),
  };
}

export async function getUsageSettings(supabase: Supabase, userId: string): Promise<UsageSettings> {
  const { data } = await supabase
    .from("ai_usage_settings")
    .select("auto_use_tickets, ticket_order")
    .eq("user_id", userId)
    .maybeSingle();
  return {
    autoUse: data?.auto_use_tickets ?? false,
    order: (data?.ticket_order as TicketOrder | undefined) ?? "half_first",
  };
}

// Spends one ticket (in the user's preferred order, falling back to the other
// kind) when auto-use is on. Returns whether a ticket was actually spent.
export async function tryAutoUseTicket(supabase: Supabase, userId: string): Promise<boolean> {
  const settings = await getUsageSettings(supabase, userId);
  if (!settings.autoUse) return false;

  const kinds: TicketKind[] = settings.order === "half_first" ? ["half", "full"] : ["full", "half"];
  for (const kind of kinds) {
    const { data, error } = await supabase.rpc("use_reset_ticket", { p_kind: kind });
    if (!error && data !== null) return true;
  }
  return false;
}
