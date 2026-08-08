# BRIEFING

## What this is

A public quiz site for The How of Happiness (Lyubomirsky). Ten chapters, one
quiz each, about twenty multiple choice questions per quiz. Anyone can play.
Google sign-in is required only to appear on the leaderboard.

## Decisions made

| Decision | Choice |
| --- | --- |
| Stack | React 18 + Vite, Tailwind, Supabase, Netlify |
| Auth | Google OAuth via Supabase, no email or password path |
| Leaderboard | Global (sum of best per chapter) plus per-chapter tabs |
| Retakes | Unlimited, best score counts, ties broken by earliest achievement |
| Anonymous play | Graded, shown, not stored |
| Grading | Server side, Postgres `security definer` function |
| Question source | JSON files in `content/chapters`, seeded by script |

## Open items

- Questions are not written yet. Chapter files are placeholders.
- Chapter titles in the database are placeholders until the content lands.
- No rate limiting on `submit_attempt`. Add one if the site gets attention.
- No dark mode.
- Display names come from Google and are user editable, so they need
  moderation if this goes wide.

## Content and copyright

Questions must be original prose testing comprehension of the book's ideas.
Do not paste passages from the book into question prompts, choices, or
explanations.
