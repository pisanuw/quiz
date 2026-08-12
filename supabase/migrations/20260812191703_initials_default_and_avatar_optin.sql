-- Initials by default, photo opt in.
--
-- The board used to publish each player's Google full name and photo URL to
-- anyone who loaded it, signed in or not. Both are now opt in, and both are
-- enforced in the views rather than hidden in the client: a hidden photo URL
-- must not travel over the API at all, or it is not hidden.
--
-- profiles gains:
--   full_name    the name Google supplied, kept so a player can switch back
--   avatar_url   unchanged, but no longer exposed unless show_avatar is true
--   show_avatar  default false
-- display_name now defaults to initials derived from the Google name.
--
-- Column level grants stop a player rewriting avatar_url or full_name to
-- arbitrary values; they may change display_name and show_avatar and nothing
-- else. The existing row level policy already limits them to their own row.

alter table public.profiles
  add column if not exists full_name   text,
  add column if not exists show_avatar boolean not null default false;

create or replace function public.initials_from(p_name text, p_email text)
returns text
language sql
immutable
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

-- backfill: keep the Google name, and replace the public display name with
-- initials only where the player never chose one of their own
update public.profiles p
set full_name = coalesce(p.full_name, p.display_name);

update public.profiles p
set display_name = public.initials_from(p.full_name, u.email)
from auth.users u
where u.id = p.id
  and p.display_name = p.full_name;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full text := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    split_part(coalesce(new.email, 'player'), '@', 1)
  );
begin
  insert into public.profiles (id, display_name, full_name, avatar_url, show_avatar)
  values (
    new.id,
    public.initials_from(v_full, new.email),
    v_full,
    new.raw_user_meta_data ->> 'avatar_url',
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- players may edit only these two columns
revoke update on public.profiles from authenticated;
grant  update (display_name, show_avatar) on public.profiles to authenticated;

-- views: avatar_url is null unless the player opted in
drop view if exists public.leaderboard_global;
drop view if exists public.leaderboard_quiz;

create view public.leaderboard_quiz as
select
  a.quiz_id,
  a.user_id,
  p.display_name,
  case when p.show_avatar then p.avatar_url end as avatar_url,
  round(avg(a.score), 1) as avg_score,
  max(a.total)           as total,
  count(*)::integer      as attempts,
  max(a.created_at)      as achieved_at,
  rank() over (
    partition by a.quiz_id
    order by avg(a.score) desc, count(*) asc, max(a.created_at) asc
  ) as rank
from public.attempts a
join public.profiles p on p.id = a.user_id
group by a.quiz_id, a.user_id, p.display_name, p.show_avatar, p.avatar_url;

create view public.leaderboard_global as
select
  user_id,
  display_name,
  avatar_url,
  round(sum(avg_score), 1) as total_score,
  count(*)::integer        as quizzes_completed,
  sum(attempts)::integer   as attempts,
  (select count(*)
     from public.questions q
     join public.quizzes z on z.id = q.quiz_id
    where z.is_published)::integer as max_score,
  max(achieved_at)         as last_active,
  rank() over (
    order by sum(avg_score) desc, sum(attempts) asc, max(achieved_at) asc
  ) as rank
from public.leaderboard_quiz
group by user_id, display_name, avatar_url;

grant select on public.leaderboard_quiz, public.leaderboard_global to anon, authenticated;

-- profiles is world readable, so stop full_name leaking through it
revoke select on public.profiles from anon, authenticated;
grant  select (id, display_name, avatar_url, show_avatar, created_at) on public.profiles to anon, authenticated;
