import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const toList = (text) =>
  text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

export default function Profile({ session }) {
  const userId = session.user.id
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    username: '',
    bio: '',
    country: '',
    languages: '',
    stack: '',
    github_url: '',
    looking_for_team: false,
  })

  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        setMessage(error.message)
      } else {
        setForm({
          username: data.username || '',
          bio: data.bio || '',
          country: data.country || '',
          languages: (data.languages || []).join(', '),
          stack: (data.stack || []).join(', '),
          github_url: data.github_url || '',
          looking_for_team: data.looking_for_team || false,
        })
      }
      setLoading(false)
    }

    loadProfile()
  }, [userId])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSave() {
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({
        username: form.username,
        bio: form.bio,
        country: form.country,
        languages: toList(form.languages),
        stack: toList(form.stack),
        github_url: form.github_url,
        looking_for_team: form.looking_for_team,
      })
      .eq('id', userId)

    setSaving(false)
    setMessage(error ? error.message : 'Profil enregistré !')
  }

  if (loading) return <p className="text-slate-300">Chargement du profil...</p>

  const inputClass =
    'w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none'

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">Mon profil</h1>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-300">Pseudo</span>
        <input name="username" value={form.username} onChange={handleChange} className={inputClass} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-300">Pays</span>
        <input
          name="country"
          value={form.country}
          onChange={handleChange}
          placeholder="Ex : Togo"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-300">Bio</span>
        <textarea
          name="bio"
          value={form.bio}
          onChange={handleChange}
          rows={3}
          placeholder="Présente-toi en quelques mots"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-300">Langues (séparées par des virgules)</span>
        <input
          name="languages"
          value={form.languages}
          onChange={handleChange}
          placeholder="Français, Anglais"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-300">Technologies (séparées par des virgules)</span>
        <input
          name="stack"
          value={form.stack}
          onChange={handleChange}
          placeholder="Flutter, Python, React"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-300">Lien GitHub</span>
        <input
          name="github_url"
          value={form.github_url}
          onChange={handleChange}
          placeholder="https://github.com/ton-pseudo"
          className={inputClass}
        />
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="looking_for_team"
          checked={form.looking_for_team}
          onChange={handleChange}
          className="h-5 w-5"
        />
        <span>Je cherche une équipe</span>
      </label>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50"
      >
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </button>

      {message && <p className="text-sm text-slate-300">{message}</p>}
    </div>
  )
}