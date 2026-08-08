-- Require authentication to take quizzes.
-- Before: anonymous visitors could read published questions and submit_attempt()
--         graded them without saving. After: only signed-in users can read a
--         quiz's questions or submit an attempt. The quizzes catalog (titles and
--         blurbs) stays public so the landing page can list chapters.

-- questions: replace the public-read policy with an authenticated-only one.
drop policy if exists "questions of published quizzes are readable by everyone" on public.questions;

create policy "questions of published quizzes are readable by signed-in users"
  on public.questions for select
  to authenticated
  using (
    exists (select 1 from public.quizzes q where q.id = quiz_id and q.is_published)
  );

-- submit_attempt(): now requires a signed-in user and always records the attempt.
create or replace function public.submit_attempt(
  p_quiz_id     integer,
  p_answers     jsonb,
  p_duration_ms integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user    uuid := auth.uid();
  v_total   integer;
  v_score   integer;
  v_results jsonb;
begin
  if v_user is null then
    raise exception 'You must be signed in to take a quiz' using errcode = '28000';
  end if;

  if not exists (select 1 from quizzes where id = p_quiz_id and is_published) then
    raise exception 'Quiz % is not available', p_quiz_id using errcode = 'P0002';
  end if;

  select
    count(*)::int,
    coalesce(sum(case when (p_answers ->> q.id::text)::int = k.correct_index then 1 else 0 end), 0)::int,
    jsonb_agg(jsonb_build_object(
      'question_id',   q.id,
      'position',      q.position,
      'chosen_index',  (p_answers ->> q.id::text)::int,
      'correct_index', k.correct_index,
      'explanation',   q.explanation
    ) order by q.position)
  into v_total, v_score, v_results
  from questions q
  join answer_keys k on k.question_id = q.id
  where q.quiz_id = p_quiz_id;

  if v_total = 0 then
    raise exception 'Quiz % has no questions', p_quiz_id using errcode = 'P0002';
  end if;

  insert into attempts (user_id, quiz_id, score, total, duration_ms)
  values (v_user, p_quiz_id, v_score, v_total, greatest(coalesce(p_duration_ms, 0), 0));

  return jsonb_build_object(
    'quiz_id', p_quiz_id,
    'score',   v_score,
    'total',   v_total,
    'saved',   true,
    'results', v_results
  );
end;
$$;

-- Anonymous callers can no longer grade; only signed-in users may.
revoke execute on function public.submit_attempt(integer, jsonb, integer) from anon;
revoke execute on function public.submit_attempt(integer, jsonb, integer) from public;
grant  execute on function public.submit_attempt(integer, jsonb, integer) to authenticated;
