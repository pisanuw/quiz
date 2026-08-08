import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Nav from './components/Nav'
import Home from './pages/Home'
import Quiz from './pages/Quiz'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import { configured } from './lib/supabase'

export default function App() {
  if (!configured) {
    return (
      <div className="mx-auto max-w-reading px-5 py-20">
        <h1 className="font-display font-extrabold text-3xl">Supabase is not configured.</h1>
        <p className="text-muted mt-2">
          Copy <code className="font-mono text-sm">.env.example</code> to{' '}
          <code className="font-mono text-sm">.env</code> and fill in{' '}
          <code className="font-mono text-sm">VITE_SUPABASE_URL</code> and{' '}
          <code className="font-mono text-sm">VITE_SUPABASE_ANON_KEY</code>, then restart the dev server.
        </p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <Nav />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/quiz/:id" element={<Quiz />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/me" element={<Profile />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <footer className="border-t border-line mt-20">
          <div className="mx-auto max-w-5xl px-5 py-8 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">
            Quizzes about The How of Happiness by Sonja Lyubomirsky. Not affiliated with the author or publisher.
          </div>
        </footer>
      </AuthProvider>
    </BrowserRouter>
  )
}
