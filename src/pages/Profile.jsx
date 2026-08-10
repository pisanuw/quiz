import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { listQuizzes, myChapterScores, updateDisplayName } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Blocks from '../components/Blocks'

export default function Profile() {
  const { user, profile, setProfile, loading } = useAuth()
  const [quizzes, setQuizzes] = useState([])
  const [best, setBest] = useState([])
  const [name, setName] = useState('')
  const [status, setStatus] = useState(null)

  useEffect(() => { if (profile) setName(profile.display_name) }, [profile])

  useEffect(() => {
    if (!user) return
    listQuizzes().then(setQuizzes).catch(() => {})
    myChapterScores(user.id).then(setBest).catch(() => {})
  }, [user])

  if (loading) return <p className="mx-auto max-w-reading px-5 pt-10 font-mono text-sm text-muted">Loading</p>
  if (!user) return <Navigate to="/" replace />

  const byQuiz = Object.fromEntries(best.map((b) => [b.quiz_id, b]))
  const total = Math.round(best.reduce((sum, b) => sum + Number(b.avg_score), 0) * 10) / 10
  const totalAttempts = best.reduce((sum, b) => sum + (b.attempts ?? 0), 0)
  const possible = quizzes.length * 20

  async function save() {
    const trimmed = name.trim().slice(0, 40)
    if (!trimmed) { setStatus('Name cannot be empty.'); return }
    try {
      await updateDisplayName(user.id, trimmed)
      setProfile((p) => ({ ...p, display_name: trimmed }))
      setStatus('Name updated.')
    } catch (e) {
      setStatus(e.message)
    }
  }

  return (
    <div className="mx-auto max-w-reading px-5 pt-10 pb-24">
      <p className="eyebrow">Your scores</p>
      <h1 className="font-display font-extrabold text-4xl tracking-tight mt-2 tabular-nums">
        <span className="font-mono">{total}</span>
        {possible ? <span className="font-mono text-2xl text-muted">/{possible}</span> : null}
      </h1>
      <p className="text-muted mt-1">
        {best.length} of {quizzes.length} chapters played, {totalAttempts}{' '}
        {totalAttempts === 1 ? 'attempt' : 'attempts'} in total
      </p>

      <div className="panel p-5 mt-8">
        <label htmlFor="name" className="eyebrow block">Name on the leaderboard</label>
        <div className="flex gap-2 mt-2">
          <input
            id="name"
            value={name}
            maxLength={40}
            onChange={(e) => { setName(e.target.value); setStatus(null) }}
            className="flex-1 bg-paper border border-line rounded-sm px-3 py-2 font-body"
          />
          <button className="btn-primary" onClick={save} disabled={name.trim() === profile?.display_name}>
            Save
          </button>
        </div>
        {status ? <p className="font-mono text-xs text-muted mt-2">{status}</p> : null}
      </div>

      <ul className="mt-8 grid gap-3">
        {quizzes.map((q) => {
          const b = byQuiz[q.id]
          return (
            <li key={q.id} className="panel p-4">
              <div className="flex items-baseline justify-between gap-3">
                <Link to={`/quiz/${q.id}`} className="font-display font-semibold hover:text-evergreen">
                  <span className="font-mono text-xs text-muted mr-2">{String(q.id).padStart(2, '0')}</span>
                  {q.title}
                </Link>
                <span className="font-mono text-xs whitespace-nowrap">
                  {b ? (
                    <>
                      {b.avg_score}<span className="text-muted">/{b.total}</span>
                      <span className="text-muted"> ({b.attempts})</span>
                      <span className="text-muted"> &middot; rank {b.rank}</span>
                    </>
                  ) : (
                    <span className="text-muted">not played</span>
                  )}
                </span>
              </div>
              <div className="mt-3">
                <Blocks filled={Math.round(b?.avg_score ?? 0)} total={b?.total ?? 20} />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
