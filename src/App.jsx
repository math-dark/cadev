import { useEffect, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Developers from './pages/Developers'
import Profile from './pages/Profile'
import Projects from './pages/Projects'
import Questions from './pages/Questions'
import Requests from './pages/Requests'

function Home({ session }) {
  const name = session.user.user_metadata?.user_name || session.user.email
  return (
    <div className="flex flex-col items-center gap-4 pt-20 text-center">
      <h1 className="text-3xl font-bold">Bienvenue, {name} !</h1>
      <p className="max-w-md text-slate-300">
        Complète ton profil, partage ton premier projet, pose une question et trouve d'autres développeurs avec qui collaborer.
      </p>
    </div>
  )
}

function Login() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function loginWithGithub() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(error.message)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    setBusy(true)

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else if (!data.session) {
        setInfo('Compte créé. Vérifie ta boîte mail pour confirmer ton adresse.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }

    setBusy(false)
  }

  const inputClass =
    'w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-900 px-4 text-center">
      <h1 className="text-4xl font-bold text-white">CADEV</h1>
      <p className="max-w-md text-slate-300">
        La plateforme des développeurs africains : rencontrez-vous, échangez, partagez vos projets et collaborez.
      </p>

      <div className="flex w-full max-w-sm flex-col gap-4 text-left">
        <button
          onClick={loginWithGithub}
          className="rounded-lg bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-200"
        >
          Se connecter avec GitHub
        </button>

        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="h-px flex-1 bg-slate-700" />
          <span>ou avec ton email</span>
          <div className="h-px flex-1 bg-slate-700" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={inputClass}
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe (6 caractères minimum)"
            className={inputClass}
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {busy ? 'Patiente...' : mode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {info && <p className="text-sm text-green-400">{info}</p>}

        <button
          onClick={() => {
            setMode(mode === 'signup' ? 'signin' : 'signup')
            setError('')
            setInfo('')
          }}
          className="text-sm text-blue-400 hover:underline"
        >
          {mode === 'signup'
            ? "J'ai déjà un compte : me connecter"
            : "Pas encore de compte ? S'inscrire"}
        </button>
      </div>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        Chargement...
      </div>
    )
  }

  if (!session) return <Login />

  const linkClass = ({ isActive }) =>
    isActive ? 'font-semibold text-white' : 'text-slate-400 hover:text-white'

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 px-6 py-4">
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-xl font-bold">CADEV</span>
          <NavLink to="/" end className={linkClass}>
            Accueil
          </NavLink>
          <NavLink to="/developers" className={linkClass}>
            Développeurs
          </NavLink>
          <NavLink to="/projects" className={linkClass}>
            Projets
          </NavLink>
          <NavLink to="/questions" className={linkClass}>
            Questions
          </NavLink>
          <NavLink to="/requests" className={linkClass}>
            Demandes
          </NavLink>
          <NavLink to="/profile" className={linkClass}>
            Mon profil
          </NavLink>
        </div>
        <button
          onClick={logout}
          className="rounded-lg border border-slate-500 px-4 py-1.5 text-sm hover:bg-slate-800"
        >
          Se déconnecter
        </button>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Home session={session} />} />
          <Route path="/developers" element={<Developers />} />
          <Route path="/projects" element={<Projects session={session} />} />
          <Route path="/questions" element={<Questions session={session} />} />
          <Route path="/requests" element={<Requests session={session} />} />
          <Route path="/profile" element={<Profile session={session} />} />
        </Routes>
      </main>
    </div>
  )
}

export default App