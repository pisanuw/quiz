-- Global board becomes a sum, and the misleading column name goes.
--
-- Two changes:
--
-- 1. leaderboard_global.total_score was the mean of chapter means, so playing
--    another chapter could only lower it. Ten chapters at 17.0 lost to one
--    chapter at 18.0, which rewarded stopping early. It is now the sum of
--    chapter averages, so every chapter attempted can only add. Unplayed
--    chapters contribute nothing, which is what makes breadth pay.
--
-- 2. leaderboard_quiz.best_score has held round(avg(score), 1) since the
--    scoring change and is renamed avg_score. total_score keeps its name
--    because under a sum it is once again an accurate one.
--
-- Ties break on fewest total attempts, then earliest. Under averaging an extra
-- attempt is already a penalty, so this makes the attempt count read the same
-- way everywhere: lower is better.
--
-- max_score counts questions in published chapters rather than assuming ten
-- chapters of twenty, so the denominator stays right if a chapter changes length.

drop view if exists public.leaderboard_global;
drop view if exists public.leaderboard_quiz;

create view public.leaderboard_quiz as
select
  a.quiz_id,
  a.user_id,
  p.display_name,
  p.avatar_url,
  round(avg(a.score), 1) as avg_score,
  round(avg(a.score), 1) as best_score,  -- deprecated alias, see note below
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

-- The best_score alias exists only so the currently deployed client keeps
-- working while Netlify builds the version that asks for avg_score. Dropped in
-- the follow-up migration once the new bundle is live.
