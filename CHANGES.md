# CHANGES

## Unreleased

- All 200 quiz questions written: 10 chapters, 20 each (5 easy, 10 medium, 5 hard)
- Sign-in now required to take a quiz (migration 20260808130000_require_signin)
- Quiz runner gated behind Google sign-in; landing page still lists chapters
- Fix: the focus ring from the previous question stayed on screen. Choice
  buttons were keyed by array index, so React reused the same DOM nodes across
  questions and the clicked button kept browser focus. The question block now
  remounts per question and focus moves to the new prompt.
- README and BRIEFING updated to match the sign-in gate
- Removed the unreachable anonymous branches from the results screen

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
