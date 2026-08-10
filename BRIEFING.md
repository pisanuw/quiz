# BRIEFING

## What this is

A quiz site for The How of Happiness (Lyubomirsky). Ten chapters, one quiz
each, twenty multiple choice questions per quiz, 200 in total. The chapter
list is public. Taking a quiz requires Google sign-in.

## Decisions made

| Decision | Choice |
| --- | --- |
| Stack | React 18 + Vite, Tailwind, Supabase, Netlify |
| Auth | Google OAuth via Supabase, no email or password path |
| Access | Chapter catalog public, questions and grading require sign-in |
| Leaderboard | Global (sum of best per chapter) plus per-chapter tabs |
| Retakes | Unlimited, every attempt counts toward the average |
| Chapter score | Mean of all attempts, one decimal. Not the best attempt |
| Global score | Sum of chapter means, out of 200. Ties break on fewest attempts |
| Attempt counts | Every attempt recorded and shown in parentheses on the boards |
| Grading | Server side, Postgres `security definer` function |
| Question source | JSON files in `content/chapters`, seeded by script |
| Question mix | 20 per chapter: 5 easy, 10 medium, 5 hard |

Anonymous play was in the original build and was removed in
`20260808234321_require_signin`. There is no ungated path left in the app or
the database.

## Open items

- No rate limiting on `submit_attempt`. Add one if the site gets attention.
- No dark mode.
- Display names come from Google and are user editable, so they need
  moderation if this goes wide.
- Question counts are locked at 20 per chapter now that scores are live.
  Changing a count invalidates comparability of existing best scores.

## Content and copyright

Questions are original prose testing comprehension of the book's ideas. Do not
paste passages from the book into question prompts, choices, or explanations.
