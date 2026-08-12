import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'

const link = ({ isActive }) =>
  `font-mono text-[0.72rem] uppercase tracking-[0.14em] pb-1 border-b ${
    isActive ? 'border-evergreen text-evergreen' : 'border-transparent text-muted hover:text-ink'
  }`

export default function Nav() {
  const { user, profile, signIn, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const wrap = useRef(null)
  const location = useLocation()

  useEffect(() => setOpen(false), [location.pathname])

  useEffect(() => {
    if (!open) return
    const onPointer = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header className="border-b border-line bg-raised/70 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-5xl px-5 py-3 flex items-center gap-5">
        <Link to="/" className="font-display font-extrabold tracking-tight leading-none text-ink">
          <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-muted font-mono">The how of</span>
          Happiness
        </Link>

        <nav className="flex items-center gap-4 ml-auto">
          <NavLink to="/" className={link} end>Chapters</NavLink>
          <NavLink to="/leaderboard" className={link}>Leaderboard</NavLink>

          {user ? (
            <div className="relative" ref={wrap}>
              <button
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Your account"
                className="block rounded-full ring-offset-2 ring-offset-raised hover:ring-2 hover:ring-evergreen transition-shadow"
              >
                <Avatar name={profile?.display_name} src={profile?.avatar_url} size="md" />
              </button>

              {open ? (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 panel shadow-lg overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-line">
                    <p className="font-display font-semibold leading-tight truncate">
                      {profile?.display_name}
                    </p>
                    <p className="font-mono text-[0.65rem] text-muted truncate">{user.email}</p>
                  </div>
                  <Link
                    to="/me"
                    role="menuitem"
                    className="block px-4 py-2.5 hover:bg-paper transition-colors"
                  >
                    Your scores and settings
                  </Link>
                  <button
                    role="menuitem"
                    onClick={signOut}
                    className="w-full text-left px-4 py-2.5 text-clay hover:bg-paper transition-colors border-t border-line"
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <button onClick={signIn} className="btn-primary">Sign in with Google</button>
          )}
        </nav>
      </div>
    </header>
  )
}
