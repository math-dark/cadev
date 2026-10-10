import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Developers() {
  const [developers, setDevelopers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [onlyTeam, setOnlyTeam] = useState(false)

  useEffect(() => {
    async function loadDevelopers() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setDevelopers(data)
      }
      setLoading(false)
    }

    loadDevelopers()
  }, [])

  const countries = useMemo(() => {
    const set = new Set(developers.map((d) => d.country?.trim()).filter(Boolean))
    return [...set].sort()
  }, [developers])

  const filtered = developers.filter((d) => {
    const text = search.trim().toLowerCase()
    const matchesSearch =
      !text ||
      d.username?.toLowerCase().includes(text) ||
      d.stack?.some((s) => s.toLowerCase().includes(text))
    const matchesCountry = !country || d.country?.trim() === country
    const matchesTeam = !onlyTeam || d.looking_for_team
    return matchesSearch && matchesCountry && matchesTeam
  })

  const inputClass =
    'rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none'

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Développeurs</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Chercher un pseudo ou une technologie"
          className={`${inputClass} flex-1`}
        />
        <select value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass}>
          <option value="">Tous les pays</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={onlyTeam}
          onChange={(e) => setOnlyTeam(e.target.checked)}
          className="h-5 w-5"
        />
        <span>Seulement ceux qui cherchent une équipe</span>
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="text-slate-300">Chargement des développeurs...</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-400">Aucun développeur ne correspond à ta recherche.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((d) => (
            <article
              key={d.id}
              className="flex gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-5"
            >
              {d.avatar_url ? (
                <img src={d.avatar_url} alt="" className="h-14 w-14 rounded-full" />
              ) : (
                <div className="h-14 w-14 rounded-full bg-slate-700" />
              )}

              <div className="flex flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{d.username || 'Anonyme'}</h2>
                  {d.country && <span className="text-sm text-slate-400">{d.country}</span>}
                  {d.looking_for_team && (
                    <span className="rounded-full bg-green-600/20 px-3 py-1 text-xs text-green-400">
                      Cherche une équipe
                    </span>
                  )}
                </div>

                {d.bio && <p className="text-slate-300">{d.bio}</p>}

                {d.stack?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {d.stack.map((s) => (
                      <span key={s} className="rounded-full bg-slate-700 px-3 py-1 text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {d.languages?.length > 0 && (
                  <p className="text-sm text-slate-400">Langues : {d.languages.join(', ')}</p>
                )}

                {d.github_url && (
                  <a
                    href={d.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-fit text-sm text-blue-400 hover:underline"
                  >
                    GitHub
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}