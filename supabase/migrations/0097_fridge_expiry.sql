-- Optional best-before date per fridge ingredient (유통기한). Used by the fridge
-- list and by the AI assistant's "냉장고 파먹기" to use up what expires first.
alter table fridge_items add column if not exists expires_on date;
