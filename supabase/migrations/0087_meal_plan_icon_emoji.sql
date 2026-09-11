-- Lets a household pick a representative icon for a meal plan, shown on the
-- meal-plan list/tab-home cards — same idea as the per-user profile icon
-- (ProfileAvatar), since a real recipe photo isn't a good fit for a card
-- that can bundle several different recipes.
alter table meal_plans add column if not exists icon_emoji text;
