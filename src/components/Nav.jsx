import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const link = ({ isActive }) =>
  `font-mono text-[0.72rem] uppercase tracking-[0.14em] pb-1 border-b ${
    isActive ? 'border-evergreen text-evergreen' : 'border-transparent text-muted hover:text-ink'
  }`

export default function Nav() {
  const { user, profile, signIn, signOut } = useAuth()

  return (
    <header className="border-b border-line bg-raised/70 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto max-w-5xl px-5 py-3 flex items-center gap-5">
        <Link to="/" className="font-display font-extrabold tracking-tight leading-none text-ink">
          <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-muted font-mono">The how of</span>
          Happiness
        </Link>
        <nav className="flex items-center gap-4 ml-auto">
          <NavLink to="/" className={link} end>Chapters</NavLink>
          <NavLink to="/leaderboard" className={link}>Leaderboard</NavLink>
          {user ? (
            <NavLink to="/me" className={link}>You</NavLink>
          ) : null}
          {user ? (
            <button onClick={signOut} className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-muted hover:text-clay">
              Sign out
            </button>
          ) : (
            <button onClick={signIn} className="btn-primary">Sign in with Google</button>
          )}
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full border border-line" />
          ) : null}
        </nav>
      </div>
    </header>
  )
}
