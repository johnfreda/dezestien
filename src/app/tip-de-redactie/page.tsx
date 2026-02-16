'use client'

import { useState } from 'react'

export default function TipDeRedactiePage() {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Nieuws')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url, description, category }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json()
        setError(data.error || 'Er ging iets mis')
      }
    } catch {
      setError('Er ging iets mis')
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Bedankt!</h1>
          <p className="text-gray-400">Je tip is ontvangen en wordt bekeken door de redactie.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 py-12">
      <div className="max-w-2xl mx-auto bg-gray-900 rounded-2xl p-8 border border-[var(--border-primary)]">
        <h1 className="text-2xl font-bold text-white mb-2">Tip de Redactie</h1>
        <p className="text-gray-400 mb-6">Heb je interessant voetbalnieuws gezien? Laat het ons weten!</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-[var(--border-primary)] focus:border-green-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Bron URL (optioneel)</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-[var(--border-primary)] focus:border-green-500 focus:outline-none"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Categorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-[var(--border-primary)] focus:border-green-500 focus:outline-none"
            >
              <option value="Nieuws">Nieuws</option>
              <option value="Review">Review</option>
              <option value="Hardware">Hardware</option>
              <option value="Tech">Tech</option>
              <option value="Indie">Indie</option>
              <option value="Gerucht">Gerucht</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Beschrijving</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-[var(--border-primary)] focus:border-green-500 focus:outline-none resize-none"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Verzenden...' : 'Tip insturen'}
          </button>
        </form>
      </div>
    </div>
  )
}
