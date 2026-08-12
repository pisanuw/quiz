# CHANGES

## Unreleased

- Fix, properly this time: the box appearing on the previously chosen option
  was sticky `:hover` on touch, not focus. Tap hover latches to whatever sits
  under the last tap point and persists, so the next question shows a border on
  the option in the same slot. All hover utilities are now behind
  `@media (hover: hover) and (pointer: fine)`. The earlier focus fix was real
  but addressed a different, less likely path.

- All 200 quiz questions written: 10 chapters, 20 each (5 easy, 10 medium, 5 hard)
- Sign-in now required to take a quiz (migration 20260808234321_require_signin)
- Quiz runner gated behind Google sign-in; landing page still lists chapters
- Fix: the focus ring from the previous question stayed on screen. Choice
  buttons were keyed by array index, so React reused the same DOM nodes across
  questions and the clicked button kept browser focus. The question block now
  remounts per question and focus moves to the new prompt.
- README and BRIEFING updated to match the sign-in gate
- Removed the unreachable anonymous branches from the results screen
- Leaderboard shows attempt counts in parentheses next to each score, per
  chapter and summed on the overall board. Retroactive: attempts were already
  recorded, so counts cover every attempt since launch.
- Profile page shows attempts per chapter and a session total
- `answer_keys` grant revoked from anon and authenticated, so the table is
  unreachable by client roles even if RLS were disabled
- Migrations verified against a real Postgres 16 instance for the first time
- Migration filenames renamed to match the versions recorded in the database,
  and the init migration recorded in `schema_migrations` where it was missing
- Restored the attempts column to `leaderboard_global` after an uncommitted
  migration dropped it and broke every board request
- Captured the uncommitted `leaderboard_average` migration into the repo,
  reconstructed from the live view definitions
- Global board now sums chapter averages out of 200 instead of averaging them.
  Averaging across chapters meant a player who did one chapter at 18.0 outranked
  one who did ten at 17.0, so finishing the book cost you rank.
- `leaderboard_quiz.best_score` renamed to `avg_score`, since it has held an
  average since the scoring change. A duplicate `best_score` was kept for one
  deploy cycle so the live client did not break, and has now been dropped.
- Ties on both boards break on fewest total attempts
- `max_score` added to the global view, counted from published questions
- Leaderboard identity is now initials with no photo by default. Players can
  set any display name and opt their Google picture in from the profile page.
- Fixed: `profiles` was world readable, so anyone could harvest the full name
  and photo URL of every player straight off the table, including those who had
  opted out. Reads are now restricted to the owner; boards are served by the
  views.
- Players hold update rights on `display_name` and `show_avatar` only
- Nav: removed the You link. The avatar opens a menu holding the profile link
  and sign out. Sign in shows only when signed out.

## 0.1.0, 2026-08-08

Initial build.

- Postgres schema: profiles, quizzes, questions, answer_keys, attempts
- RLS throughout, answer keys unreadable by any client role
- `submit_attempt()` security definer function grades and records attempts
- `leaderboard_global` and `leaderboard_quiz` views with window ranking
- Profile row auto-created on first Google sign-in
- React front end: chapters index, quiz runner, results review, leaderboard
  with overall and per-chapter tabs, profile page with editable display name
- Content pipeline: JSON per chapter, validating seed script
- Netlify config with SPA redirect
