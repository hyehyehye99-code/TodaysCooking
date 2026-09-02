-- IAP (RevenueCat) removed from the app entirely — App Store review kept
-- rejecting the build over broken in-app purchases, so the paid tier is
-- gone rather than fixed. AI-usage overrides are now granted by the admin
-- directly (via grantPromoToUser / the promotions admin dashboard) instead
-- of a purchase or a user typing in a promo code themselves.
--
-- promo_codes and promo_code_redemptions stay — they still back the admin
-- grant panel. redeem_promo_code() goes away since nothing calls it
-- anymore (the self-serve promo-code-entry UI is deleted too); the admin
-- grant path writes directly to promo_code_redemptions instead.

drop function if exists redeem_promo_code(text);
drop table if exists subscription_events;
drop table if exists household_subscriptions;
