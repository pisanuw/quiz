-- Drop the backward compatibility alias.
--
-- 20260810031321 kept best_score as a duplicate of avg_score so the deployed
-- client survived the window between the migration landing and Netlify
-- publishing the bundle that asks for avg_score. Verified the live bundle now
-- requests avg_score and never mentions best_score, so the alias is unused.
-- Leaving it would recreate the naming trap the rename removed.
--
-- Both views are dropped and recreated rather than replaced: create or replace
-- view cannot drop a column, and leaderboard_global depends on leaderboard_quiz.
-- leaderboard_global is byte for byte what 20260810031321 created.

drop view if exists public.leaderboard_global;
drop view if exists public.leaderboard_quiz;

create view public.leaderboard_quiz as
select
  a.quiz_id,
  a.user_id,
  p.display_name,
  p.avatar_url,
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
group by a.quiz_id, a.user_id, p.display_name, p.avatar_url;

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
