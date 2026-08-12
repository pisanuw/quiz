import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { listQuizzes, myChapterScores, updateDisplayName, updateShowAvatar } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Blocks from '../components/Blocks'
import Avatar from '../components/Avatar'

export default function Profile() {
  const { user, profile, setProfile, loading } = useAuth()
  const [quizzes, setQuizzes] = useState([])
  const [best, setBest] = useState([])
  const [name, setName] = useState('')
  const [showAvatar, setShowAvatar] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    if (!profile) return
    setName(profile.display_name)
    setShowAvatar(Boolean(profile.show_avatar))
  }, [profile])

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

  async function saveName() {
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

  async function togglePhoto(next) {
    setShowAvatar(next)
    setStatus(null)
    try {
      await updateShowAvatar(user.id, next)
      setProfile((p) => ({ ...p, show_avatar: next }))
      setStatus(next ? 'Your picture is now on the board.' : 'Your picture is hidden.')
    } catch (e) {
      setShowAvatar(!next)
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
        <h2 className="eyebrow">How you appear on the leaderboard</h2>

        <div className="flex items-center gap-4 mt-4">
          <Avatar name={name || profile?.display_name} src={showAvatar ? profile?.avatar_url : null} size="lg" />
          <div className="min-w-0">
            <p className="font-display font-semibold text-lg truncate">{name || profile?.display_name}</p>
            <p className="font-mono text-[0.68rem] text-muted">This is what everybody else sees</p>
          </div>
        </div>

        <label htmlFor="name" className="eyebrow block mt-6">Display name</label>
        <div className="flex gap-2 mt-2">
          <input
            id="name"
            value={name}
            maxLength={40}
            onChange={(e) => { setName(e.target.value); setStatus(null) }}
            className="flex-1 bg-paper border border-line rounded-sm px-3 py-2 font-body"
          />
          <button className="btn-primary" onClick={saveName} disabled={name.trim() === profile?.display_name}>
            Save
          </button>
        </div>
        <p className="font-mono text-[0.65rem] text-muted mt-2">
          Defaults to your initials. Your full name is never shown unless you type it here.
        </p>

        <div className="mt-6 pt-5 border-t border-line flex items-start gap-3">
          <input
            id="photo"
            type="checkbox"
            checked={showAvatar}
            onChange={(e) => togglePhoto(e.target.checked)}
            className="mt-1 w-4 h-4 accent-evergreen"
          />
          <label htmlFor="photo" className="leading-snug">
            Show my Google profile picture
            <span className="block font-mono text-[0.65rem] text-muted mt-0.5">
              Off by default. While it is off, your picture is not sent to anyone viewing the board.
            </span>
          </label>
        </div>

        {status ? <p className="font-mono text-xs text-muted mt-3">{status}</p> : null}
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
