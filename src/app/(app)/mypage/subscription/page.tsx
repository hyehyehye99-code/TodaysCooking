import { BackButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { SubscriptionPaywall } from "@/components/SubscriptionPaywall";
import { PromoCodeButton } from "./promo-code-button";

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { household } = await getCurrentHousehold();

  const { data: promoGrant } = user
    ? await supabase.from("promo_code_redemptions").select("user_id").eq("user_id", user.id).maybeSingle()
    : { data: null };
  const isUnlimited = !!promoGrant;

  const { data: sub } = household
    ? await supabase
        .from("household_subscriptions")
        .select("active, expires_at")
        .eq("household_id", household.id)
        .maybeSingle()
    : { data: null };
  const isPremium = !!sub?.active && (!sub.expires_at || new Date(sub.expires_at) > new Date());

  return (
    <div className="pt-2">
      <div className="mb-5 flex items-center gap-3">
        <BackButton href="/mypage" />
        <h1 className="text-[22px] font-bold">구독</h1>
      </div>

      {/* Plan status (free/premium/unlimited, usage count) now lives in the
          내 프로필 card on the mypage top screen — this page is purely the
          purchase/promo-code flow. */}
      {!isUnlimited && (
        <>
          <SubscriptionPaywall isPremium={isPremium} householdId={household?.id ?? null} />

          <div className="mt-6 flex justify-center">
            <PromoCodeButton />
          </div>
        </>
      )}
    </div>
  );
}
