-- Replace the leaderboard views with security definer functions.
--
-- Supabase's advisor flags leaderboard_global and leaderboard_quiz as
-- "Security Definer View": they are owned by postgres with security_invoker
-- off, so they read past row level security. That bypass is intentional and
-- load bearing (attempts is own-rows-only, profiles is now own-row-only), so
-- flipping security_invoker on would empty both boards. The blessed pattern in
-- this schema, stated in CLAUDE.md, is that a read path over RLS goes through a
-- security definer function, exactly like submit_attempt(). Functions do not
-- trip the view advisor.
--
-- Phase one of two. This adds the functions and leaves the views in place, so
-- the deployed client (which selects the views) keeps working while the new
-- client (which calls the functions) is shipped. The views are dropped in a
-- second migration once the rpc client is live. This staging is deliberate:
-- dropping the views in lockstep with a client that still selects them is the
-- skew that broke the board three times before.
--
-- A function and a view can share a name (pg_proc vs pg_class), and PostgREST
-- routes /rpc/leaderboard_global to the function and /leaderboard_global to the
-- view, so the two coexist without collision through phase one.
--
-- The returned column shapes match the views byte for byte, including types
-- (avg_score and total_score numeric, rank bigint), so no client value changes.

create or replace function public.leaderboard_quiz()
returns table (
  quiz_id      integer,
  user_id      uuid,
  display_name text,
  avatar_url   text,
  avg_score    numeric,
  total        smallint,
  attempts     integer,
  achieved_at  timestamptz,
  rank         bigint
)
language sql
stable
security definer
set search_path = public
as $$
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
$$;

create or replace function public.leaderboard_global()
returns table (
  user_id           uuid,
  display_name      text,
  avatar_url        text,
  total_score       numeric,
  quizzes_completed integer,
  attempts          integer,
  max_score         integer,
  last_active       timestamptz,
  rank              bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    q.user_id,
    q.display_name,
    q.avatar_url,
    round(sum(q.avg_score), 1) as total_score,
    count(*)::integer          as quizzes_completed,
    sum(q.attempts)::integer   as attempts,
    (select count(*)
       from public.questions qn
       join public.quizzes z on z.id = qn.quiz_id
      where z.is_published)::integer as max_score,
    max(q.achieved_at)         as last_active,
    rank() over (
      order by sum(q.avg_score) desc, sum(q.attempts) asc, max(q.achieved_at) asc
    ) as rank
  from public.leaderboard_quiz() q
  group by q.user_id, q.display_name, q.avatar_url;
$$;

revoke execute on function public.leaderboard_quiz()  from public;
revoke execute on function public.leaderboard_global() from public;
grant  execute on function public.leaderboard_quiz()  to anon, authenticated;
grant  execute on function public.leaderboard_global() to anon, authenticated;
