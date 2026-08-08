import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getQuestions, getQuiz, submitAttempt } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Results from './Results'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function Quiz() {
  const { id } = useParams()
  const quizId = Number(id)
  const { user, loading: authLoading, signIn } = useAuth()
  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState(null)
  const [answers, setAnswers] = useState({})
  const [index, setIndex] = useState(0)
  const [outcome, setOutcome] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const startedAt = useRef(Date.now())

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setQuiz(null); setQuestions(null); setAnswers({}); setIndex(0); setOutcome(null); setError(null)
    startedAt.current = Date.now()
    Promise.all([getQuiz(quizId), getQuestions(quizId)])
      .then(([q, qs]) => { if (!cancelled) { setQuiz(q); setQuestions(qs) } })
      .catch((e) => { if (!cancelled) setError(e.message) })
    return () => { cancelled = true }
  }, [quizId, user])

  const answered = useMemo(() => Object.keys(answers).length, [answers])
  const current = questions?.[index]
  const allAnswered = questions && answered === questions.length

  async function finish() {
    setBusy(true); setError(null)
    try {
      const result = await submitAttempt(quizId, answers, Date.now() - startedAt.current)
      setOutcome(result)
      window.scrollTo({ top: 0 })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  function retake() {
    setAnswers({}); setIndex(0); setOutcome(null)
    startedAt.current = Date.now()
    window.scrollTo({ top: 0 })
  }

  if (authLoading) {
    return <Shell><p className="font-mono text-sm text-muted">Loading</p></Shell>
  }

  if (!user) {
    return (
      <Shell>
        <p className="eyebrow">Chapter {String(quizId).padStart(2, '0')}</p>
        <h1 className="font-display font-extrabold text-3xl mt-1">Sign in to take this quiz</h1>
        <p className="text-muted mt-2">
          Quizzes are for signed-in players, so every attempt can be graded and saved to the board.
          Signing in with Google takes a moment.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={signIn} className="btn-primary">Sign in with Google</button>
          <Link to="/" className="btn-quiet">Back to chapters</Link>
        </div>
      </Shell>
    )
  }

  if (error && !questions) {
    return (
      <Shell>
        <p className="font-mono text-sm text-clay">This chapter did not load: {error}</p>
        <Link to="/" className="btn-quiet inline-block mt-4">Back to chapters</Link>
      </Shell>
    )
  }

  if (!questions || !quiz) {
    return <Shell><p className="font-mono text-sm text-muted">Loading chapter {quizId}</p></Shell>
  }

  if (questions.length === 0) {
    return (
      <Shell>
        <h1 className="font-display font-extrabold text-3xl">{quiz.title}</h1>
        <p className="text-muted mt-2">This chapter has no questions yet.</p>
        <Link to="/" className="btn-quiet inline-block mt-4">Back to chapters</Link>
      </Shell>
    )
  }

  if (outcome) {
    return <Results quiz={quiz} questions={questions} answers={answers} outcome={outcome} onRetake={retake} />
  }

  return (
    <Shell>
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow">Chapter {String(quiz.id).padStart(2, '0')}</p>
        <p className="font-mono text-[0.7rem] text-muted">
          {index + 1} / {questions.length}
        </p>
      </div>
      <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight mt-1">{quiz.title}</h1>

      <div className="flex items-center gap-[3px] mt-5" aria-hidden="true">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setIndex(i)}
            title={`Question ${i + 1}`}
            className={`flex-1 h-2 rounded-[1px] transition-colors ${
              i === index ? 'bg-evergreen' : answers[q.id] !== undefined ? 'bg-marigold' : 'bg-line'
            }`}
          />
        ))}
      </div>

      <div className="mt-8">
        <p className="font-display font-semibold text-xl sm:text-2xl leading-snug">{current.prompt}</p>
        <ul className="mt-5 grid gap-2">
          {current.choices.map((choice, i) => {
            const selected = answers[current.id] === i
            return (
              <li key={i}>
                <button
                  onClick={() => {
                    setAnswers((prev) => ({ ...prev, [current.id]: i }))
                    if (index < questions.length - 1) setTimeout(() => setIndex(index + 1), 160)
                  }}
                  aria-pressed={selected}
                  className={`w-full text-left flex gap-3 items-baseline p-4 rounded-sm border transition-colors ${
                    selected
                      ? 'bg-evergreen text-raised border-evergreen'
                      : 'bg-raised border-line hover:border-ink'
                  }`}
                >
                  <span className={`font-mono text-xs ${selected ? 'text-marigold' : 'text-muted'}`}>
                    {LETTERS[i]}
                  </span>
                  <span className="leading-snug">{choice}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {error ? <p className="font-mono text-sm text-clay mt-5">Could not grade this: {error}</p> : null}

      <div className="mt-8 flex items-center gap-3 border-t border-line pt-5">
        <button className="btn-quiet" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}>
          Previous
        </button>
        <button
          className="btn-quiet"
          onClick={() => setIndex(Math.min(questions.length - 1, index + 1))}
          disabled={index === questions.length - 1}
        >
          Next
        </button>
        <button className="btn-primary ml-auto" onClick={finish} disabled={!allAnswered || busy}>
          {busy ? 'Grading' : allAnswered ? 'See how you did' : `${questions.length - answered} left`}
        </button>
      </div>
    </Shell>
  )
}

function Shell({ children }) {
  return <div className="mx-auto max-w-reading px-5 pt-10 pb-24">{children}</div>
}
