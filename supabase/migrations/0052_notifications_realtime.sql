-- Lets the client subscribe to postgres_changes INSERTs on notifications
-- (see NotificationToaster), so a new recipe/cook-log/shopping-list
-- notification can pop up in-app immediately instead of only ever being
-- seen by visiting 마이페이지 → 알림 or via a background push.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;
