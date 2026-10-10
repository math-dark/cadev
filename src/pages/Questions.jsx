import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const toList = (text) =>
  text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

const inputClass =
  'w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none'

function Answers({ questionId, userId, onChange }) {
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function loadAnswers() {
    const { data, error } = await supabase
      .from('answers')
      .select('*, profiles(username, avatar_url), votes(user_id)')
      .eq('question_id', questionId)

    if (error) {
      setError(error.message)
    } else {
      const sorted = [...data].sort(
        (a, b) =>
          (b.votes?.length || 0) - (a.votes?.length || 0) ||
          new Date(a.created_at) - new Date(b.created_at)
      )
      setAnswers(sorted)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadAnswers()
  }, [questionId])

  async function handleAdd() {
    if (!body.trim()) return
    setSending(true)
    setError('')

    const { error } = await supabase.from('answers').insert({
      question_id: questionId,
      author_id: userId,
      body: body.trim(),
    })

    setSending(false)

    if (error) {
      setError(error.message)
    } else {
      setBody('')
      await loadAnswers()
      onChange()
    }
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('answers').delete().eq('id', id)
    if (error) {
      setError(error.message)
    } else {
      await loadAnswers()
      onChange()
    }
  }

  async function toggleVote(answer) {
    const voted = answer.votes?.some((v) => v.user_id === userId)

    const { error } = voted
      ? await supabase.from('votes').delete().eq('answer_id', answer.id).eq('user_id', userId)
      : await supabase.from('votes').insert({ answer_id: answer.id, user_id: userId })

    if (error) {
      setError(error.message)
    } else {
      loadAnswers()
    }
  }

  return (
    <div className="flex flex-col gap-4 border-t border-slate-700 pt-4">
      {loading ? (
        <p className="text-sm text-slate-400">Chargement des réponses...</p>
      ) : answers.length === 0 ? (
        <p className="text-sm text-slate-400">Aucune réponse pour l'instant. Sois le premier à répondre !</p>
      ) : (
        answers.map((a) => {
          const voteCount = a.votes?.length || 0
          const voted = a.votes?.some((v) => v.user_id === userId)

          return (
            <div key={a.id} className="flex gap-3">
              <button
                onClick={() => toggleVote(a)}
                className={`flex h-14 w-12 flex-col items-center justify-center rounded-lg border text-sm ${
                  voted
                    ? 'border-blue-500 bg-blue-600/20 text-blue-400'
                    : 'border-slate-600 text-slate-400 hover:border-slate-400'
                }`}
                title={voted ? 'Retirer mon vote' : 'Voter pour cette réponse'}
              >
                <span>▲</span>
                <span className="font-semibold">{voteCount}</span>
              </button>

              <div className="flex flex-1 flex-col gap-1">
                <p className="whitespace-pre-line text-slate-200">{a.body}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>par {a.profiles?.username || 'anonyme'}</span>
                  {a.author_id === userId && (
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })
      )}

      <div className="flex flex-col gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Écris ta réponse..."
          className={inputClass}
        />
        <button
          onClick={handleAdd}
          disabled={sending || !body.trim()}
          className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
        >
          {sending ? 'Envoi...' : 'Répondre'}
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </div>
  )
}

export default function Questions({ session }) {
  const userId = session.user.id
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ title: '', body: '', tags: '' })
  const [openId, setOpenId] = useState(null)

  async function loadQuestions() {
    const { data, error } = await supabase
      .from('questions')
      .select('*, profiles(username, avatar_url), answers(count)')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
    } else {
      setQuestions(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadQuestions()
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit() {
    if (!form.title.trim() || !form.body.trim()) {
      setMessage('Le titre et le détail de la question sont obligatoires.')
      return
    }

    setSaving(true)
    setMessage('')

    const { error } = await supabase.from('questions').insert({
      author_id: userId,
      title: form.title.trim(),
      body: form.body.trim(),
      tags: toList(form.tags),
    })

    setSaving(false)

    if (error) {
      setMessage(error.message)
    } else {
      setForm({ title: '', body: '', tags: '' })
      setShowForm(false)
      setMessage('Question publiée !')
      loadQuestions()
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cette question ?')) return
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (error) {
      setMessage(error.message)
    } else {
      loadQuestions()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Questions</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500"
        >
          {showForm ? 'Annuler' : 'Poser une question'}
        </button>
      </div>

      {message && <p className="text-sm text-slate-300">{message}</p>}

      {showForm && (
        <div className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-5">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-300">Titre *</span>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ex : Comment intégrer le paiement mobile money ?"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-300">Détails *</span>
            <textarea
              name="body"
              value={form.body}
              onChange={handleChange}
              rows={5}
              placeholder="Explique ton problème, ce que tu as déjà essayé..."
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-300">Technologies (séparées par des virgules)</span>
            <input
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="Flutter, Firebase"
              className={inputClass}
            />
          </label>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? 'Publication...' : 'Publier la question'}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-slate-300">Chargement des questions...</p>
      ) : questions.length === 0 ? (
        <p className="text-slate-400">Aucune question pour l'instant. Pose la première !</p>
      ) : (
        <div className="flex flex-col gap-4">
          {questions.map((q) => {
            const count = q.answers?.[0]?.count ?? 0
            const isOpen = openId === q.id

            return (
              <article
                key={q.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold">{q.title}</h2>
                  {q.author_id === userId && (
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Supprimer
                    </button>
                  )}
                </div>

                <p className="whitespace-pre-line text-slate-300">{q.body}</p>

                {q.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {q.tags.map((t) => (
                      <span key={t} className="rounded-full bg-slate-700 px-3 py-1 text-xs">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <button
                    onClick={() => setOpenId(isOpen ? null : q.id)}
                    className="text-blue-400 hover:underline"
                  >
                    {isOpen ? 'Masquer les réponses' : `Réponses (${count})`}
                  </button>
                  <span className="ml-auto text-slate-400">
                    par {q.profiles?.username || 'anonyme'}
                  </span>
                </div>

                {isOpen && <Answers questionId={q.id} userId={userId} onChange={loadQuestions} />}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}