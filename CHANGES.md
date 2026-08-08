# CHANGES

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
