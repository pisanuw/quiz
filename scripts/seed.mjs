#!/usr/bin/env node
// Push content/chapters/*.json into Supabase. Requires the service role key.
//   node scripts/seed.mjs            seed every chapter
//   node scripts/seed.mjs 3 7        seed chapters 3 and 7 only
//   node scripts/seed.mjs --check    validate the JSON, touch nothing

import { readFile, readdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'content', 'chapters')

const args = process.argv.slice(2)
const checkOnly = args.includes('--check')
const only = args.filter((a) => /^\d+$/.test(a)).map(Number)

function fail(msg) {
  console.error('error: ' + msg)
  process.exit(1)
}

function validate(file, data) {
  const where = (i) => `${file} question ${i + 1}`
  if (!Number.isInteger(data.chapter) || data.chapter < 1 || data.chapter > 10)
    fail(`${file}: chapter must be an integer 1 to 10`)
  const expected = String(data.chapter).padStart(2, '0')
  if (file !== `chapter-${expected}.json`) fail(`${file}: chapter field does not match filename`)
  if (!data.title?.trim()) fail(`${file}: title is required`)
  if (!Array.isArray(data.questions)) fail(`${file}: questions must be an array`)

  data.questions.forEach((q, i) => {
    if (!q.prompt?.trim()) fail(`${where(i)}: prompt is empty`)
    if (!Array.isArray(q.choices) || q.choices.length < 2 || q.choices.length > 6)
      fail(`${where(i)}: needs 2 to 6 choices`)
    if (q.choices.some((c) => typeof c !== 'string' || !c.trim()))
      fail(`${where(i)}: a choice is blank`)
    if (new Set(q.choices.map((c) => c.trim().toLowerCase())).size !== q.choices.length)
      fail(`${where(i)}: duplicate choices`)
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.choices.length)
      fail(`${where(i)}: answer must be a valid index into choices`)
  })

  if (data.publish && data.questions.length === 0)
    fail(`${file}: cannot publish a chapter with no questions`)
  return data
}

const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort()
const chapters = []
for (const file of files) {
  const data = JSON.parse(await readFile(join(dir, file), 'utf8'))
  validate(file, data)
  if (only.length === 0 || only.includes(data.chapter)) chapters.push(data)
}

console.log(`validated ${files.length} chapter files`)
for (const c of chapters) {
  console.log(`  chapter ${c.chapter}: ${c.questions.length} questions, publish=${c.publish === true}`)
}
if (checkOnly) process.exit(0)

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) fail('set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example)')

const { createClient } = await import('@supabase/supabase-js')
const db = createClient(url, key, { auth: { persistSession: false } })

for (const c of chapters) {
  const { error: qErr } = await db.from('quizzes').upsert({
    id: c.chapter,
    slug: `chapter-${String(c.chapter).padStart(2, '0')}`,
    title: c.title,
    blurb: c.blurb || null,
    is_published: c.publish === true
  })
  if (qErr) fail(`chapter ${c.chapter}: ${qErr.message}`)

  const { error: delErr } = await db.from('questions').delete().eq('quiz_id', c.chapter)
  if (delErr) fail(`chapter ${c.chapter}: ${delErr.message}`)

  if (c.questions.length) {
    const rows = c.questions.map((q, i) => ({
      quiz_id: c.chapter,
      position: i + 1,
      prompt: q.prompt,
      choices: q.choices,
      explanation: q.explanation || null
    }))
    const { data: inserted, error: insErr } = await db.from('questions').insert(rows).select('id, position')
    if (insErr) fail(`chapter ${c.chapter}: ${insErr.message}`)

    const keys = inserted
      .sort((a, b) => a.position - b.position)
      .map((row, i) => ({ question_id: row.id, correct_index: c.questions[i].answer }))
    const { error: keyErr } = await db.from('answer_keys').insert(keys)
    if (keyErr) fail(`chapter ${c.chapter}: ${keyErr.message}`)
  }

  console.log(`seeded chapter ${c.chapter}`)
}
console.log('done')
