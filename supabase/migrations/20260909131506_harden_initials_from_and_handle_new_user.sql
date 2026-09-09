-- Harden two functions the advisor flagged after the leaderboard change.
--
-- 1. initials_from had no search_path set (lint 0011). It touches only built in
--    functions, so pin it to an empty path. pg_catalog is still searched, so the
--    built ins resolve while nothing user created can be shadowed in.
-- 2. handle_new_user is a security definer trigger function, but Supabase's
--    default grants leave it callable by anon and authenticated over /rpc
--    (lints 0028 and 0029). A trigger fires without an execute grant, so
--    revoking execute closes the rpc surface without touching the signup path.

create or replace function public.initials_from(p_name text, p_email text)
returns text
language sql
immutable
set search_path = ''
as $$
  with parts as (
    select regexp_split_to_array(
      trim(regexp_replace(coalesce(nullif(trim(p_name), ''), split_part(coalesce(p_email,'?'), '@', 1)), '[^[:alpha:][:space:]]', ' ', 'g')),
      '\s+'
    ) as w
  )
  select coalesce(
    nullif(
      upper(
        left(coalesce(w[1], ''), 1) ||
        case when array_length(w, 1) > 1 then left(w[array_length(w, 1)], 1) else '' end
      ),
      ''
    ),
    '?'
  )
  from parts;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
