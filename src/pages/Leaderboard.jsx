import { useEffect, useState } from 'react'
import { globalLeaderboard, listQuizzes, quizLeaderboard } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function Leaderboard() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState([])
  const [tab, setTab] = useState('overall')
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { listQuizzes().then(setQuizzes).catch(() => {}) }, [])

  useEffect(() => {
    let cancelled = false
    setRows(null); setError(null)
    const load = tab === 'overall' ? globalLeaderboard() : quizLeaderboard(tab)
    load
      .then((data) => { if (!cancelled) setRows(data) })
      .catch((e) => { if (!cancelled) setError(e.message) })
    return () => { cancelled = true }
  }, [tab])

  return (
    <div className="mx-auto max-w-3xl px-5 pt-10 pb-24">
      <p className="eyebrow">Best score per chapter, added up</p>
      <h1 className="font-display font-extrabold text-4xl tracking-tight mt-2">Leaderboard</h1>
      <p className="font-mono text-[0.7rem] text-muted mt-2">
        Score, then attempts in parentheses. Retakes are unlimited and only your best counts.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Tab active={tab === 'overall'} onClick={() => setTab('overall')}>Overall</Tab>
        {quizzes.map((q) => (
          <Tab key={q.id} active={tab === q.id} onClick={() => setTab(q.id)}>
            {String(q.id).padStart(2, '0')}
          </Tab>
        ))}
      </div>

      {error ? <p className="font-mono text-sm text-clay mt-8">Could not load the board: {error}</p> : null}

      {rows === null ? (
        <p className="font-mono text-sm text-muted mt-8">Loading</p>
      ) : rows.length === 0 ? (
        <p className="text-muted mt-8">
          Nobody has posted a score here yet. Be the first.
        </p>
      ) : (
        <ol className="mt-8 border-t border-line">
          {rows.map((r) => {
            const mine = user && r.user_id === user.id
            const score = tab === 'overall' ? r.total_score : r.best_score
            const outOf = tab === 'overall' ? null : r.total
            const tries = r.attempts ?? 0
            const triesLabel =
              tab === 'overall'
                ? `${tries} ${tries === 1 ? 'attempt' : 'attempts'} across all chapters`
                : `${tries} ${tries === 1 ? 'attempt' : 'attempts'} at this chapter`
            return (
              <li
                key={r.user_id}
                className={`flex items-center gap-4 py-3 border-b border-line ${mine ? 'bg-marigold/10 -mx-3 px-3' : ''}`}
              >
                <span className="font-mono text-sm text-muted w-8 tabular-nums">{r.rank}</span>
                {r.avatar_url ? (
                  <img src={r.avatar_url} alt="" className="w-7 h-7 rounded-full border border-line" />
                ) : (
                  <span className="w-7 h-7 rounded-full border border-line bg-paper" />
                )}
                <span className="font-display font-semibold truncate">{r.display_name}</span>
                {tab === 'overall' ? (
                  <span className="font-mono text-[0.68rem] text-muted whitespace-nowrap">
                    {r.quizzes_completed} ch
                  </span>
                ) : null}
                <span className="ml-auto font-mono tabular-nums whitespace-nowrap">
                  {score}
                  {outOf ? <span className="text-muted">/{outOf}</span> : null}
                  <span className="text-muted" title={triesLabel}> ({tries})</span>
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

function Tab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`font-mono text-[0.72rem] uppercase tracking-[0.12em] px-3 py-1.5 rounded-sm border transition-colors ${
        active ? 'bg-ink text-raised border-ink' : 'border-line text-muted hover:border-ink hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
