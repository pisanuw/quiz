# How of Happiness quizzes

Ten chapter quizzes with Google sign-in and a leaderboard. React + Vite on the
front, Supabase (Postgres, Auth, RLS) on the back, Netlify for hosting.

Sign-in is required to play. The chapter list is public, so anyone can see what
is on offer, but reading questions and submitting an attempt both require an
authenticated session.

## Rules baked in

- Sign in with Google to take a quiz. There is no anonymous path.
- Best score per chapter counts, unlimited retakes
- Global board ranks the sum of your best scores, tie broken by who got there first
- Per-chapter boards rank best score for that chapter
- Every attempt is recorded, not just your best one. The leaderboard shows the
  count in parentheses next to the score, so a high score reached on the first
  try reads differently from one reached on the twentieth.

## Setup

1. Create a Supabase project.
2. Run every file in `supabase/migrations` in filename order.

   Do not use `supabase db push` against the current database. See
   "Shared database" below.
3. Authentication > Providers > Google: enable it, paste the client ID and
   secret from a Google Cloud OAuth client. Add the Supabase callback URL
   (`https://YOURPROJECT.supabase.co/auth/v1/callback`) as an authorized
   redirect URI on the Google side.
4. Authentication > URL Configuration: set the site URL and add your Netlify
   domain plus `http://localhost:5173` to the redirect allow list.
5. `cp .env.example .env` and fill in the values.
6. `npm install && npm run dev`

## Writing questions

Questions live in `content/chapters/chapter-NN.json`, one file per chapter,
twenty questions each. See `content/README.md` for the shape. Then:

```
node scripts/seed.mjs --check   # validate, touch nothing
npm run seed                    # push every chapter
node scripts/seed.mjs 3         # push chapter 3 only
```

Seeding needs `SUPABASE_SERVICE_ROLE_KEY` in the environment. A chapter stays
hidden until its file has `"publish": true`.

## Why grading happens in the database

If the correct answers lived in the browser bundle, anyone could read them out
of devtools and post a perfect score. So:

- `answer_keys` has RLS enabled and no policies at all, which means no client
  role can read it, ever
- `submit_attempt()` is a `security definer` function: it checks you are signed
  in, grades the submission, writes the attempt, and returns the results
- `attempts` has no insert policy, so scores can only be written by that function
- `questions` is readable only by the `authenticated` role, and `anon` has no
  execute grant on `submit_attempt()`

A determined person can still retake a quiz until they have seen every answer.
Given unlimited retakes and best-score-counts, that is by design.

## Deploy

Netlify, build command `npm run build`, publish `dist`. Set
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as build environment
variables. `netlify.toml` already handles the SPA redirect.

## Shared database

This app does not have its own Supabase project. It lives in the project named
`upvoteme` (ref `arktxlrlyceffyozdwhq`), alongside upvoteme itself, word-path,
and a tutoring system. Consequences:

- One migration history serves all of them. `supabase_migrations.schema_migrations`
  contains rows like `word_path_leaderboard` that have no file in this repo, so
  `supabase db push` from here will complain about remote migrations it cannot
  find locally. Apply migrations through the SQL editor or the MCP connector
  instead, then record the version by hand.
- Filenames in this repo are kept equal to the `version` recorded in that table,
  so the two histories agree. If you apply a migration by any route, make sure
  the recorded version matches the filename.
- `public` is shared, so a bare `drop view leaderboard` would hit somebody
  else's table. Quiz-owned objects are: `profiles`, `quizzes`, `questions`,
  `answer_keys`, `attempts`, `leaderboard_quiz`, `leaderboard_global`,
  `submit_attempt()`, `handle_new_user()`. The base table named `leaderboard`
  belongs to word-path, not to this app.

Giving the quiz its own project would remove all three problems.
