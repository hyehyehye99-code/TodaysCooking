import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Event types that mean the household's entitlement should be (re)activated.
// Anything else (BILLING_ISSUE, CANCELLATION before expiry, etc.) leaves
// `active` untouched — RevenueCat still sends EXPIRATION once the grace
// period actually runs out, which is what flips `active` to false.
const ACTIVATING_EVENTS = new Set(["INITIAL_PURCHASE", "RENEWAL", "PRODUCT_CHANGE", "UNCANCELLATION"]);
const DEACTIVATING_EVENTS = new Set(["EXPIRATION"]);

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.REVENUECAT_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const event = body?.event;
  if (!event?.app_user_id || typeof event.type !== "string") {
    return NextResponse.json({ error: "malformed event" }, { status: 400 });
  }

  // The client configures Purchases with appUserID = household.id, so
  // app_user_id from RevenueCat already *is* our household_id — no mapping
  // table needed.
  const householdId: string = event.app_user_id;
  const productId: string | null = event.product_id ?? null;
  const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null;

  if (ACTIVATING_EVENTS.has(event.type)) {
    const supabase = createAdminClient();
    await supabase.from("household_subscriptions").upsert({
      household_id: householdId,
      active: true,
      product_id: productId,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    });
  } else if (DEACTIVATING_EVENTS.has(event.type)) {
    const supabase = createAdminClient();
    await supabase.from("household_subscriptions").upsert({
      household_id: householdId,
      active: false,
      product_id: productId,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true });
}
