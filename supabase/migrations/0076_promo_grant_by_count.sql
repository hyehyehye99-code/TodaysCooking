-- Switches promo grants from "unlimited AI usage for a duration" to "N
-- additional AI generations, on top of (not counted against) the normal
-- weekly free quota" — a fixed, finite top-up instead of an open-ended
-- unlimited period. No production redemptions exist yet, so the old
-- duration/expiry columns are dropped rather than converted.
alter table promo_codes drop column if exists duration_days;
alter table promo_codes add column grant_count integer not null default 10;
alter table promo_codes alter column grant_count drop default;

alter table promo_code_redemptions drop column if exists expires_at;
alter table promo_code_redemptions add column remaining_count integer not null default 0;
alter table promo_code_redemptions alter column remaining_count drop default;

-- Marks which ai_recipe_generations row was paid for out of a promo grant's
-- remaining_count instead of the normal free weekly quota, so the
-- weekly-limit count query in ai-recipe.ts can exclude bonus-covered ones.
alter table ai_recipe_generations add column if not exists via_bonus boolean not null default false;
