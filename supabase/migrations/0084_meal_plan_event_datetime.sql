-- Upgrade event_date (date-only, 0082) to a real timestamp — the info box
-- shows a time alongside the date (e.g. "2026년 6월 6일 11시").
alter table meal_plans alter column event_date type timestamptz using (event_date::timestamptz);
