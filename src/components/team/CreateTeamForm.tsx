'use client'

import { useState } from 'react'

interface CreateTeamFormProps {
  onCreated: () => void
}

export function CreateTeamForm({ onCreated }: CreateTeamFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Team name is required')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      })

      if (response.ok) {
        setName('')
        setDescription('')
        onCreated()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create team')
      }
    } catch (err) {
      setError('Failed to create team')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="team-name"
          className="block text-sm font-medium text-slate-300 mb-1"
        >
          Team Name
        </label>
        <input
          id="team-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Engineering Team"
        />
      </div>

      <div>
        <label
          htmlFor="team-description"
          className="block text-sm font-medium text-slate-300 mb-1"
        >
          Description
        </label>
        <textarea
          id="team-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Our accountability group for career growth"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
      >
        {submitting ? 'Creating...' : 'Create Team'}
      </button>
    </form>
  )
}
