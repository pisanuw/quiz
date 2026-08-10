-- Restore the attempts column to leaderboard_global.
--
-- 20260809231511_leaderboard_average switched both views to averaging and in
-- the process dropped attempts from the global view, while the deployed client
-- still selects it, so every board request returned 400.
--
-- This changes nothing about the averaging semantics introduced there. Only
-- leaderboard_global is recreated; leaderboard_quiz is left exactly as it is.

drop view if exists public.leaderboard_global;

create view public.leaderboard_global as
select
  user_id,
  display_name,
  avatar_url,
  round(avg(best_score), 1) as total_score,
  count(*)::integer         as quizzes_completed,
  max(total)                as total,
  sum(attempts)::integer    as attempts,
  max(achieved_at)          as last_active,
  rank() over (order by avg(best_score) desc, max(achieved_at)) as rank
from public.leaderboard_quiz
group by user_id, display_name, avatar_url;

grant select on public.leaderboard_global to anon, authenticated;
