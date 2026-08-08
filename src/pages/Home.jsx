import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listQuizzes, myBestScores } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Blocks from '../components/Blocks'

export default function Home() {
  const { user, signIn } = useAuth()
  const [quizzes, setQuizzes] = useState(null)
  const [best, setBest] = useState({})
  const [error, setError] = useState(null)

  useEffect(() => {
    listQuizzes().then(setQuizzes).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!user) { setBest({}); return }
    myBestScores(user.id)
      .then((rows) => setBest(Object.fromEntries(rows.map((r) => [r.quiz_id, r]))))
      .catch(() => {})
  }, [user])

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24">
      <section className="pt-14 pb-12 border-b border-line">
        <p className="eyebrow">Ten chapters, ten quizzes</p>
        <h1 className="font-display font-extrabold text-4xl sm:text-6xl leading-[0.95] tracking-tight mt-3 max-w-reading">
          Half is your set point.<br />
          A tenth is circumstance.<br />
          <span className="text-marigold">The rest is what you do.</span>
        </h1>

        <div className="mt-8 max-w-md">
          <div className="flex items-center gap-[3px]">
            {Array.from({ length: 10 }, (_, i) => (
              <span
                key={i}
                className={`flex-1 h-8 rounded-[1px] ${
                  i < 5 ? 'bg-line' : i < 9 ? 'bg-marigold' : 'bg-evergreen'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted">
            <span>50 set point</span>
            <span className="text-marigold">40 activity</span>
            <span>10 circumstance</span>
          </div>
        </div>

        <p className="mt-8 text-lg text-muted max-w-reading">
          Work through Sonja Lyubomirsky&rsquo;s book a chapter at a time. Twenty questions each,
          graded instantly. Anyone can play. Sign in with Google if you want your best scores on the
          board.
        </p>
      </section>

      {error ? (
        <p className="mt-10 font-mono text-sm text-clay">
          Could not load the chapters: {error}
        </p>
      ) : null}

      <section className="mt-10">
        <div className="flex items-baseline gap-4">
          <h2 className="eyebrow">Chapters</h2>
          {!user ? (
            <button onClick={signIn} className="eyebrow text-evergreen underline underline-offset-4">
              Sign in to save scores
            </button>
          ) : null}
        </div>

        {quizzes === null ? (
          <p className="mt-6 font-mono text-sm text-muted">Loading chapters</p>
        ) : quizzes.length === 0 ? (
          <div className="mt-6 panel p-6">
            <p className="font-display font-semibold text-lg">No chapters are open yet.</p>
            <p className="text-muted mt-1">
              Questions get written in <code className="font-mono text-sm">content/chapters</code>,
              then seeded. Publish a chapter and it shows up here.
            </p>
          </div>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {quizzes.map((q) => {
              const b = best[q.id]
              return (
                <li key={q.id}>
                  <Link
                    to={`/quiz/${q.id}`}
                    className="panel block p-5 h-full hover:border-evergreen transition-colors"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-mono text-[0.7rem] tracking-[0.14em] text-muted">
                        {String(q.id).padStart(2, '0')}
                      </span>
                      {b ? (
                        <span className="font-mono text-[0.7rem] text-evergreen">
                          best {b.best_score}/{b.total} &middot; rank {b.rank}
                        </span>
                      ) : (
                        <span className="font-mono text-[0.7rem] text-muted">not played</span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-xl leading-tight mt-1">{q.title}</h3>
                    {q.blurb ? <p className="text-muted mt-1 leading-snug">{q.blurb}</p> : null}
                    <div className="mt-4">
                      <Blocks filled={b?.best_score ?? 0} total={b?.total ?? 20} label={b ? `best ${b.best_score} of ${b.total}` : 'not played yet'} />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
