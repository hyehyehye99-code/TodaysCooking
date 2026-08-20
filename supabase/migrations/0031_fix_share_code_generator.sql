-- gen_random_bytes() lives in pgcrypto, which on this project is installed
-- outside the `public` search_path this function runs under, so the call
-- failed with "function gen_random_bytes(integer) does not exist". Swap to
-- gen_random_uuid() — already used everywhere else in this schema (e.g.
-- every table's id default) and needs no extension qualification at all.
create or replace function generate_household_share_code()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := replace(gen_random_uuid()::text, '-', '');
    exit when not exists (select 1 from households where share_code = candidate);
  end loop;
  return candidate;
end;
$$;
