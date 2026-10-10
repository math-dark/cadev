import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const toList = (text) =>
  text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

const emptyForm = {
  title: '',
  description: '',
  github_url: '',
  demo_url: '',
  tags: '',
  looking_for_help: false,
}

const inputClass =
  'w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none'

function Comments({ projectId, userId, onChange }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function loadComments() {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(username, avatar_url)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setComments(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadComments()
  }, [projectId])

  async function handleAdd() {
    if (!body.trim()) return
    setSending(true)
    setError('')

    const { error } = await supabase.from('comments').insert({
      project_id: projectId,
      author_id: userId,
      body: body.trim(),
    })

    setSending(false)

    if (error) {
      setError(error.message)
    } else {
      setBody('')
      await loadComments()
      onChange()
    }
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (error) {
      setError(error.message)
    } else {
      await loadComments()
      onChange()
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-slate-700 pt-4">
      {loading ? (
        <p className="text-sm text-slate-400">Chargement des commentaires...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-400">Aucun commentaire pour l'instant.</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            {c.profiles?.avatar_url ? (
              <img src={c.profiles.avatar_url} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-slate-700" />
            )}
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{c.profiles?.username || 'anonyme'}</span>
                {c.author_id === userId && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Supprimer
                  </button>
                )}
              </div>
              <p className="whitespace-pre-line text-sm text-slate-300">{c.body}</p>
            </div>
          </div>
        ))
      )}

      <div className="flex flex-col gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Donne ton avis, une idée ou un conseil..."
          className={inputClass}
        />
        <button
          onClick={handleAdd}
          disabled={sending || !body.trim()}
          className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
        >
          {sending ? 'Envoi...' : 'Commenter'}
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </div>
  )
}

function JoinRequest({ project, request, userId, onChange }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  if (project.author_id === userId) return null

  async function handleSend() {
    setSending(true)
    setError('')

    const { error } = await supabase.from('join_requests').insert({
      project_id: project.id,
      user_id: userId,
      message: message.trim() || null,
    })

    setSending(false)

    if (error) {
      setError(error.message)
    } else {
      setOpen(false)
      setMessage('')
      onChange()
    }
  }

  async function handleCancel() {
    const { error } = await supabase.from('join_requests').delete().eq('id', request.id)
    if (error) {
      setError(error.message)
    } else {
      onChange()
    }
  }

  if (request) {
    const styles = {
      pending: 'bg-yellow-600/20 text-yellow-400',
      accepted: 'bg-green-600/20 text-green-400',
      declined: 'bg-red-600/20 text-red-400',
    }
    const labels = {
      pending: 'Demande envoyée, en attente',
      accepted: 'Demande acceptée : tu fais partie du projet !',
      declined: 'Demande refusée',
    }

    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs ${styles[request.status]}`}>
          {labels[request.status]}
        </span>
        {request.status === 'pending' && (
          <button onClick={handleCancel} className="text-xs text-red-400 hover:text-red-300">
            Annuler ma demande
          </button>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    )
  }

  if (!project.looking_for_help) return null

  return (
    <div className="flex flex-col gap-2">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-fit rounded-lg border border-green-500 px-4 py-2 text-sm font-semibold text-green-400 hover:bg-green-600/10"
        >
          Demander à rejoindre
        </button>
      ) : (
        <div className="flex flex-col gap-2 rounded-lg border border-slate-700 p-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Présente-toi et dis comment tu peux aider (optionnel)"
            className={inputClass}
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleSend}
              disabled={sending}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold hover:bg-green-500 disabled:opacity-50"
            >
              {sending ? 'Envoi...' : 'Envoyer la demande'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-sm text-slate-400 hover:text-white"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}

export default function Projects({ session }) {
  const userId = session.user.id
  const [projects, setProjects] = useState([])
  const [myRequests, setMyRequests] = useState({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [openId, setOpenId] = useState(null)

  async function loadProjects() {
    const [projectsRes, requestsRes] = await Promise.all([
      supabase
        .from('projects')
        .select('*, profiles(username, avatar_url), comments(count)')
        .order('created_at', { ascending: false }),
      supabase.from('join_requests').select('*').eq('user_id', userId),
    ])

    if (projectsRes.error) {
      setMessage(projectsRes.error.message)
    } else {
      setProjects(projectsRes.data)
    }

    if (!requestsRes.error) {
      const map = {}
      requestsRes.data.forEach((r) => {
        map[r.project_id] = r
      })
      setMyRequests(map)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadProjects()
  }, [])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit() {
    if (!form.title.trim() || !form.description.trim()) {
      setMessage('Le titre et la description sont obligatoires.')
      return
    }

    setSaving(true)
    setMessage('')

    const { error } = await supabase.from('projects').insert({
      author_id: userId,
      title: form.title.trim(),
      description: form.description.trim(),
      github_url: form.github_url.trim() || null,
      demo_url: form.demo_url.trim() || null,
      tags: toList(form.tags),
      looking_for_help: form.looking_for_help,
    })

    setSaving(false)

    if (error) {
      setMessage(error.message)
    } else {
      setForm(emptyForm)
      setShowForm(false)
      setMessage('Projet publié !')
      loadProjects()
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer ce projet ?')) return
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) {
      setMessage(error.message)
    } else {
      loadProjects()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projets</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500"
        >
          {showForm ? 'Annuler' : 'Partager un projet'}
        </button>
      </div>

      {message && <p className="text-sm text-slate-300">{message}</p>}

      {showForm && (
        <div className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-5">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-300">Titre *</span>
            <input name="title" value={form.title} onChange={handleChange} className={inputClass} />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-300">Description *</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Que fait ton projet ? Quel problème résout-il ?"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-300">Lien GitHub</span>
            <input
              name="github_url"
              value={form.github_url}
              onChange={handleChange}
              placeholder="https://github.com/..."
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-300">Lien de la démo</span>
            <input
              name="demo_url"
              value={form.demo_url}
              onChange={handleChange}
              placeholder="https://..."
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-300">Technologies (séparées par des virgules)</span>
            <input
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="React, Supabase"
              className={inputClass}
            />
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="looking_for_help"
              checked={form.looking_for_help}
              onChange={handleChange}
              className="h-5 w-5"
            />
            <span>Je cherche de l'aide ou des coéquipiers</span>
          </label>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? 'Publication...' : 'Publier'}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-slate-300">Chargement des projets...</p>
      ) : projects.length === 0 ? (
        <p className="text-slate-400">Aucun projet pour l'instant. Sois le premier à en partager un !</p>
      ) : (
        <div className="flex flex-col gap-4">
          {projects.map((p) => {
            const count = p.comments?.[0]?.count ?? 0
            const isOpen = openId === p.id

            return (
              <article
                key={p.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold">{p.title}</h2>
                  {p.author_id === userId && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Supprimer
                    </button>
                  )}
                </div>

                <p className="whitespace-pre-line text-slate-300">{p.description}</p>

                {p.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <span key={t} className="rounded-full bg-slate-700 px-3 py-1 text-xs">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {p.looking_for_help && (
                  <span className="w-fit rounded-full bg-green-600/20 px-3 py-1 text-xs text-green-400">
                    Cherche de l'aide
                  </span>
                )}

                <JoinRequest
                  project={p}
                  request={myRequests[p.id]}
                  userId={userId}
                  onChange={loadProjects}
                />

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {p.github_url && (
                    <a
                      href={p.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      GitHub
                    </a>
                  )}
                  {p.demo_url && (
                    <a
                      href={p.demo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      Démo
                    </a>
                  )}
                  <button
                    onClick={() => setOpenId(isOpen ? null : p.id)}
                    className="text-blue-400 hover:underline"
                  >
                    {isOpen ? 'Masquer les commentaires' : `Commentaires (${count})`}
                  </button>
                  <span className="ml-auto text-slate-400">
                    par {p.profiles?.username || 'anonyme'}
                  </span>
                </div>

                {isOpen && <Comments projectId={p.id} userId={userId} onChange={loadProjects} />}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}