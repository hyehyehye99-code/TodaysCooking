-- Lets the admin dashboard grant an existing promo code to a specific user
-- directly (in addition to the user typing the code in themselves). The
-- write happens through the service-role admin client, same as every other
-- admin.ts action, so no new RLS policy is needed. granted_by just lets the
-- admin UI show whether a grant came from self-redemption or admin action.
alter table promo_code_redemptions add column if not exists granted_by text not null default 'user';
