-- Show how many times each player has taken a quiz.
--
-- No schema change: attempts already records every submission, so these counts
-- are retroactive to the first attempt ever recorded. Both leaderboard views
-- are dropped and recreated because leaderboard_global reads from
-- leaderboard_quiz, and the column list of both is changing.

drop view if exists public.leaderboard_global;
drop view if exists public.leaderboard_quiz;

create view public.leaderboard_quiz as
select
  b.quiz_id,
  b.user_id,
  p.display_name,
  p.avatar_url,
  b.best_score,
  b.total,
  b.achieved_at,
  c.attempts,
  rank() over (partition by b.quiz_id order by b.best_score desc, b.achieved_at asc) as rank
from (
  -- best score per player per chapter, earliest time they reached it
  select distinct on (a.user_id, a.quiz_id)
    a.user_id, a.quiz_id, a.score as best_score, a.total, a.created_at as achieved_at
  from public.attempts a
  order by a.user_id, a.quiz_id, a.score desc, a.created_at asc
) b
join (
  select user_id, quiz_id, count(*)::int as attempts
  from public.attempts
  group by user_id, quiz_id
) c on c.user_id = b.user_id and c.quiz_id = b.quiz_id
join public.profiles p on p.id = b.user_id;

create view public.leaderboard_global as
select
  user_id,
  display_name,
  avatar_url,
  sum(best_score)::int as total_score,
  count(*)::int        as quizzes_completed,
  sum(attempts)::int   as attempts,
  max(achieved_at)     as last_active,
  rank() over (order by sum(best_score) desc, max(achieved_at) asc) as rank
from public.leaderboard_quiz
group by user_id, display_name, avatar_url;

grant select on public.leaderboard_quiz, public.leaderboard_global to anon, authenticated;
