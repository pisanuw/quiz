-- How of Happiness Quiz: initial schema
-- Design notes:
--   * answer_keys has RLS enabled and NO policies, so no client can ever read it.
--   * Grading happens in submit_attempt(), a security definer function.
--   * Leaderboard views are owned by postgres (security_invoker off) so they can
--     aggregate across all attempts while attempts itself stays row-locked.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tables

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

create table public.quizzes (
  id           integer primary key,          -- chapter number, 1..10
  slug         text not null unique,
  title        text not null,
  blurb        text,
  is_published boolean not null default false
);

create table public.questions (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     integer not null references public.quizzes (id) on delete cascade,
  position    integer not null,
  prompt      text not null,
  choices     jsonb not null,
  explanation text,
  unique (quiz_id, position),
  constraint choices_is_array check (jsonb_typeof(choices) = 'array')
);

create table public.answer_keys (
  question_id   uuid primary key references public.questions (id) on delete cascade,
  correct_index smallint not null check (correct_index >= 0)
);

create table public.attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  quiz_id     integer not null references public.quizzes (id) on delete cascade,
  score       smallint not null,
  total       smallint not null,
  duration_ms integer,
  created_at  timestamptz not null default now()
);

create index attempts_best_idx on public.attempts (user_id, quiz_id, score desc, created_at asc);
create index questions_quiz_idx on public.questions (quiz_id, position);

-- ---------------------------------------------------------------- rls

alter table public.profiles    enable row level security;
alter table public.quizzes     enable row level security;
alter table public.questions   enable row level security;
alter table public.answer_keys enable row level security;
alter table public.attempts    enable row level security;

create policy "profiles are readable by everyone"
  on public.profiles for select using (true);
create policy "you can edit your own profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "published quizzes are readable by everyone"
  on public.quizzes for select using (is_published);

create policy "questions of published quizzes are readable by everyone"
  on public.questions for select using (
    exists (select 1 from public.quizzes q where q.id = quiz_id and q.is_published)
  );

-- answer_keys: RLS on, zero policies. Only security definer code sees it.

create policy "you can read your own attempts"
  on public.attempts for select using (auth.uid() = user_id);
-- no insert policy: attempts are written only by submit_attempt()

-- ---------------------------------------------------------------- grading

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

  if v_user is not null then
    insert into attempts (user_id, quiz_id, score, total, duration_ms)
    values (v_user, p_quiz_id, v_score, v_total, greatest(p_duration_ms, 0));
  end if;

  return jsonb_build_object(
    'quiz_id', p_quiz_id,
    'score',   v_score,
    'total',   v_total,
    'saved',   v_user is not null,
    'results', v_results
  );
end;
$$;

revoke execute on function public.submit_attempt(integer, jsonb, integer) from public;
grant  execute on function public.submit_attempt(integer, jsonb, integer) to anon, authenticated;

-- ---------------------------------------------------------------- leaderboards

create view public.leaderboard_quiz as
select
  b.quiz_id,
  b.user_id,
  p.display_name,
  p.avatar_url,
  b.best_score,
  b.total,
  b.achieved_at,
  rank() over (partition by b.quiz_id order by b.best_score desc, b.achieved_at asc) as rank
from (
  select distinct on (a.user_id, a.quiz_id)
    a.user_id, a.quiz_id, a.score as best_score, a.total, a.created_at as achieved_at
  from public.attempts a
  order by a.user_id, a.quiz_id, a.score desc, a.created_at asc
) b
join public.profiles p on p.id = b.user_id;

create view public.leaderboard_global as
select
  user_id,
  display_name,
  avatar_url,
  sum(best_score)::int as total_score,
  count(*)::int        as quizzes_completed,
  max(achieved_at)     as last_active,
  rank() over (order by sum(best_score) desc, max(achieved_at) asc) as rank
from public.leaderboard_quiz
group by user_id, display_name, avatar_url;

grant select on public.leaderboard_quiz, public.leaderboard_global to anon, authenticated;

-- ---------------------------------------------------------------- profile bootstrap

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, 'player'), '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- chapter rows

insert into public.quizzes (id, slug, title, blurb, is_published) values
  (1,  'chapter-01', 'Chapter 1',  null, false),
  (2,  'chapter-02', 'Chapter 2',  null, false),
  (3,  'chapter-03', 'Chapter 3',  null, false),
  (4,  'chapter-04', 'Chapter 4',  null, false),
  (5,  'chapter-05', 'Chapter 5',  null, false),
  (6,  'chapter-06', 'Chapter 6',  null, false),
  (7,  'chapter-07', 'Chapter 7',  null, false),
  (8,  'chapter-08', 'Chapter 8',  null, false),
  (9,  'chapter-09', 'Chapter 9',  null, false),
  (10, 'chapter-10', 'Chapter 10', null, false);
