# CLAUDE.md

Project conventions for this repo.

## Prose

No em dashes anywhere in prose, docs, UI copy, or commit messages. Use commas,
colons, or parentheses.

## Content

Quiz questions are original writing about the book's ideas. Never reproduce
sentences from The How of Happiness. Explanations are yours, not the author's.

## Data

- Never expose `answer_keys` to a client role. Any new read path goes through a
  `security definer` function.
- Never add an insert policy on `attempts`. Writes go through `submit_attempt()`.
- Changing the number of questions in a published chapter invalidates existing
  best scores. Do it before launch, not after.

## Files

- Schema changes are new files in `supabase/migrations`, never edits to old ones
- Question edits go in `content/chapters`, then `npm run seed`
- Log each working session in `docs/AI-log-YYYY-MM-DD.md`
- Update `CHANGES.md` on every release
