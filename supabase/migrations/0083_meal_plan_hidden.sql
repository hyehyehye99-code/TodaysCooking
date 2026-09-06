-- Hides a meal plan from the swipeable carousel on /explore without
-- deleting it — managed from the carousel's "메뉴판 목록" sheet.
alter table meal_plans add column if not exists hidden boolean not null default false;
