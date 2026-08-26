import { BackButton, GlassCard } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { SubscriptionPaywall } from "@/components/SubscriptionPaywall";
import { PromoCodeButton } from "./promo-code-button";
import { getDictionary } from "@/lib/i18n/server";

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { household } = await getCurrentHousehold();
  const { dict } = await getDictionary();

  const { data: promoGrant } = user
    ? await supabase.from("promo_code_redemptions").select("expires_at").eq("user_id", user.id).maybeSingle()
    : { data: null };
  const isUnlimited = !!promoGrant && (!promoGrant.expires_at || new Date(promoGrant.expires_at) > new Date());
  const promoDaysLeft = promoGrant?.expires_at
    ? Math.ceil((new Date(promoGrant.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

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
          purchase/promo-code flow. A redeemed promo code still gets its own
          status card here, though, since that's exactly what redeeming one
          on this page produces immediate feedback for. */}
      {isUnlimited ? (
        <GlassCard className="bg-white p-4">
          <p className="text-sm font-semibold text-ink">{dict.mypage.unlimitedActive}</p>
          <p className="mt-1 text-xs text-ink-soft">
            {promoGrant?.expires_at
              ? dict.mypage.promoExpiresTemplate.replace(
                  "{date}",
                  new Date(promoGrant.expires_at).toLocaleDateString("ko-KR")
                )
              : dict.mypage.unlimitedDesc}
          </p>
          {promoDaysLeft !== null && (
            <p className="mt-2 text-xs font-semibold text-accent-ink">
              {promoDaysLeft <= 0
                ? dict.mypage.promoDaysLeftToday
                : dict.mypage.promoDaysLeftTemplate.replace("{days}", String(promoDaysLeft))}
            </p>
          )}
        </GlassCard>
      ) : (
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
