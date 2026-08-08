# Quiz content

One JSON file per chapter, `chapters/chapter-NN.json`. This is the source of
truth: edit here, commit, then run `npm run seed` to push into Supabase.

Shape:

```json
{
  "chapter": 1,
  "title": "Is It Possible to Become Happier?",
  "blurb": "One sentence shown on the chapter card.",
  "publish": true,
  "questions": [
    {
      "prompt": "Question text.",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 2,
      "explanation": "Shown on the results screen after grading."
    }
  ]
}
```

Rules the seeder enforces:

- `answer` is a zero-based index into `choices`
- 2 to 6 choices, no duplicates, no blanks
- `chapter` is 1 to 10 and must match the filename
- questions are numbered by array order

Set `"publish": false` to hide a chapter from the site while you draft it.
Reseeding a chapter replaces its questions and leaves past attempts alone, so
scores stay comparable only if you do not change the number of questions after
people have played. Add questions before launch, not after.
