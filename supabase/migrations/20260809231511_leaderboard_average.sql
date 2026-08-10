-- RECONSTRUCTED, NOT THE ORIGINAL SOURCE.
--
-- This migration was applied directly to the database and never committed. The
-- statements below were rebuilt from pg_get_viewdef() after the fact, so they
-- produce the same views but may not match the original text.
--
-- What it changed: scoring moved from "best attempt counts" to "average across
-- all attempts". Both views were recreated. Note that leaderboard_quiz.best_score
-- no longer holds a best score, it holds round(avg(score), 1); the column name
-- was kept so the client would not have to change.
--
-- It also dropped the attempts column from leaderboard_global, which broke the
-- deployed client. Restored in 20260810013540.

drop view if exists public.leaderboard_global;
drop view if exists public.leaderboard_quiz;

create view public.leaderboard_quiz as
select
  a.quiz_id,
  a.user_id,
  p.display_name,
  p.avatar_url,
  round(avg(a.score), 1) as best_score,
  max(a.total)           as total,
  count(*)::integer      as attempts,
  max(a.created_at)      as achieved_at,
  rank() over (partition by a.quiz_id order by avg(a.score) desc, max(a.created_at)) as rank
from public.attempts a
join public.profiles p on p.id = a.user_id
group by a.quiz_id, a.user_id, p.display_name, p.avatar_url;

create view public.leaderboard_global as
select
  user_id,
  display_name,
  avatar_url,
  round(avg(best_score), 1) as total_score,
  count(*)::integer         as quizzes_completed,
  max(total)                as total,
  max(achieved_at)          as last_active,
  rank() over (order by avg(best_score) desc, max(achieved_at)) as rank
from public.leaderboard_quiz
group by user_id, display_name, avatar_url;

grant select on public.leaderboard_quiz, public.leaderboard_global to anon, authenticated;
