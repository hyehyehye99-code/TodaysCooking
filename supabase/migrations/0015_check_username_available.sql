create or replace function is_username_taken(check_username text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from auth.users
    where email = lower(check_username) || '@onaeyo.app'
  );
$$;

grant execute on function is_username_taken(text) to anon, authenticated;
