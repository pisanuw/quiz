import { Link } from 'react-router-dom'
import Blocks from '../components/Blocks'
import { useAuth } from '../context/AuthContext'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function Results({ quiz, questions, answers, outcome, onRetake }) {
  const { user, signIn } = useAuth()
  const byId = Object.fromEntries(outcome.results.map((r) => [r.question_id, r]))
  const pct = Math.round((outcome.score / outcome.total) * 100)

  return (
    <div className="mx-auto max-w-reading px-5 pt-10 pb-24">
      <p className="eyebrow">Chapter {String(quiz.id).padStart(2, '0')} result</p>
      <h1 className="font-display font-extrabold text-5xl sm:text-6xl tracking-tight mt-2 tabular-nums">
        <span className="font-mono">{outcome.score}</span>
        <span className="text-muted font-mono text-3xl">/{outcome.total}</span>
      </h1>
      <p className="font-mono text-sm text-muted mt-1">{pct}% correct</p>

      <div className="mt-5">
        <Blocks filled={outcome.score} total={outcome.total} size="md" label={`${outcome.score} of ${outcome.total} correct`} />
      </div>

      {outcome.saved ? (
        <p className="mt-6 font-mono text-sm text-evergreen">
          Saved. Your best score for this chapter is what counts on the board.
        </p>
      ) : (
        <div className="mt-6 panel p-5">
          <p className="font-display font-semibold">This score was not saved.</p>
          <p className="text-muted mt-1">
            Sign in with Google and take it again to put it on the leaderboard.
          </p>
          <button onClick={signIn} className="btn-primary mt-3">Sign in with Google</button>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button className="btn-primary" onClick={onRetake}>Take it again</button>
        <Link className="btn-quiet" to="/leaderboard">Leaderboard</Link>
        <Link className="btn-quiet" to="/">All chapters</Link>
      </div>

      <h2 className="eyebrow mt-14 pt-6 border-t border-line">Review</h2>
      <ol className="mt-5 grid gap-5">
        {questions.map((q, i) => {
          const r = byId[q.id]
          const chosen = answers[q.id]
          const right = r?.correct_index
          const correct = chosen === right
          return (
            <li key={q.id} className="panel p-5">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, '0')}</span>
                <span className={`font-mono text-[0.68rem] uppercase tracking-[0.14em] ${correct ? 'text-evergreen' : 'text-clay'}`}>
                  {correct ? 'Correct' : 'Missed'}
                </span>
              </div>
              <p className="font-display font-semibold text-lg leading-snug mt-2">{q.prompt}</p>
              <ul className="mt-3 grid gap-1">
                {q.choices.map((choice, ci) => {
                  const isRight = ci === right
                  const isChosen = ci === chosen
                  return (
                    <li
                      key={ci}
                      className={`flex gap-3 items-baseline text-[0.95rem] px-3 py-2 rounded-sm border ${
                        isRight
                          ? 'border-evergreen bg-evergreen/5'
                          : isChosen
                          ? 'border-clay bg-clay/5'
                          : 'border-transparent'
                      }`}
                    >
                      <span className="font-mono text-xs text-muted">{LETTERS[ci]}</span>
                      <span className="leading-snug">{choice}</span>
                      {isChosen && !isRight ? (
                        <span className="ml-auto font-mono text-[0.62rem] uppercase tracking-[0.12em] text-clay">yours</span>
                      ) : null}
                      {isRight ? (
                        <span className="ml-auto font-mono text-[0.62rem] uppercase tracking-[0.12em] text-evergreen">answer</span>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
              {r?.explanation ? (
                <p className="text-muted leading-snug mt-3 border-l-2 border-line pl-3">{r.explanation}</p>
              ) : null}
            </li>
          )
        })}
      </ol>

      {!user ? (
        <button onClick={signIn} className="btn-primary mt-10">Sign in with Google</button>
      ) : null}
    </div>
  )
}
