import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function RequestCard({ request, onAnswer, busy }) {
  const profile = request.profiles
  const pending = request.status === 'pending'

  const statusStyles = {
    accepted: 'bg-green-600/20 text-green-400',
    declined: 'bg-red-600/20 text-red-400',
  }
  const statusLabels = {
    accepted: 'Acceptée',
    declined: 'Refusée',
  }

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-5">
      <p className="text-sm text-slate-400">
        Pour le projet <span className="font-semibold text-white">{request.projects?.title}</span>
      </p>

      <div className="flex gap-4">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-12 w-12 rounded-full" />
        ) : (
          <div className="h-12 w-12 rounded-full bg-slate-700" />
        )}

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{profile?.username || 'Anonyme'}</h2>
            {profile?.country && <span className="text-sm text-slate-400">{profile.country}</span>}
          </div>

          {profile?.stack?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.stack.map((s) => (
                <span key={s} className="rounded-full bg-slate-700 px-3 py-1 text-xs">
                  {s}
                </span>
              ))}
            </div>
          )}

          {request.message && (
            <p className="whitespace-pre-line rounded-lg bg-slate-900/60 p-3 text-sm text-slate-300">
              {request.message}
            </p>
          )}

          {profile?.github_url && (
            <a
              href={profile.github_url}
              target="_blank"
              rel="noreferrer"
              className="w-fit text-sm text-blue-400 hover:underline"
            >
              Voir son GitHub
            </a>
          )}
        </div>
      </div>

      {pending ? (
        <div className="flex gap-3">
          <button
            onClick={() => onAnswer(request.id, 'accepted')}
            disabled={busy}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold hover:bg-green-500 disabled:opacity-50"
          >
            Accepter
          </button>
          <button
            onClick={() => onAnswer(request.id, 'declined')}
            disabled={busy}
            className="rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-600/10 disabled:opacity-50"
          >
            Refuser
          </button>
        </div>
      ) : (
        <span className={`w-fit rounded-full px-3 py-1 text-xs ${statusStyles[request.status]}`}>
          {statusLabels[request.status]}
        </span>
      )}
    </article>
  )
}

export default function Requests({ session }) {
  const userId = session.user.id
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function loadRequests() {
    const { data, error } = await supabase
      .from('join_requests')
      .select(
        '*, projects!inner(title, author_id), profiles(username, avatar_url, country, stack, github_url)'
      )
      .eq('projects.author_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setRequests(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadRequests()
  }, [])

  async function handleAnswer(id, status) {
    setBusy(true)
    setError('')

    const { error } = await supabase.from('join_requests').update({ status }).eq('id', id)

    setBusy(false)

    if (error) {
      setError(error.message)
    } else {
      loadRequests()
    }
  }

  const pending = requests.filter((r) => r.status === 'pending')
  const answered = requests.filter((r) => r.status !== 'pending')

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Demandes pour rejoindre tes projets</h1>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="text-slate-300">Chargement des demandes...</p>
      ) : requests.length === 0 ? (
        <p className="text-slate-400">
          Aucune demande pour l'instant. Publie un projet avec la case « Je cherche de l'aide » cochée pour en recevoir.
        </p>
      ) : (
        <>
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">En attente ({pending.length})</h2>
            {pending.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune demande en attente.</p>
            ) : (
              pending.map((r) => (
                <RequestCard key={r.id} request={r} onAnswer={handleAnswer} busy={busy} />
              ))
            )}
          </section>

          {answered.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Déjà traitées ({answered.length})</h2>
              {answered.map((r) => (
                <RequestCard key={r.id} request={r} onAnswer={handleAnswer} busy={busy} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}