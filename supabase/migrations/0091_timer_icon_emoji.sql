-- Replaces the manual color picker (dropped from the create-timer form) with
-- an optional icon emoji, same convention as recipes' icon_emoji.
alter table timers add column icon_emoji text;
