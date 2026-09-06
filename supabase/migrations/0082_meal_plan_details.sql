-- Optional event date and headcount, shown in the info box at the top of a
-- meal plan's detail view — display-only (headcount doesn't scale any
-- ingredient amounts).
alter table meal_plans add column if not exists event_date date;
alter table meal_plans add column if not exists headcount integer;
