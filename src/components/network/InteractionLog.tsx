'use client'

import { useState } from 'react'

interface Interaction {
  id: string
  type: string
  date: string
  summary?: string
  notes?: string
  sentiment?: string
}

interface InteractionLogProps {
  interactions: Interaction[]
  contactId: string
  onLogInteraction?: () => void
}

const typeIcons: Record<string, string> = {
  meeting: '🤝',
  email: '📧',
  call: '📞',
  coffee: '☕',
  event: '🎉',
  linkedin: '💼',
  intro: '👋',
}

export function InteractionLog({ interactions, contactId, onLogInteraction }: InteractionLogProps) {
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState('meeting')
  const [summary, setSummary] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/network/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          type,
          summary,
        }),
      })

      if (response.ok) {
        setShowForm(false)
        setSummary('')
        onLogInteraction?.()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Interactions</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
        >
          {showForm ? 'Cancel' : 'Log Interaction'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              <option value="meeting">Meeting</option>
              <option value="email">Email</option>
              <option value="call">Call</option>
              <option value="coffee">Coffee</option>
              <option value="event">Event</option>
              <option value="linkedin">LinkedIn</option>
              <option value="intro">Introduction</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Summary</label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief summary..."
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {interactions.map((interaction) => (
          <div
            key={interaction.id}
            className="bg-slate-800 rounded-lg p-3 flex items-start gap-3"
          >
            <span className="text-2xl">{typeIcons[interaction.type] || '📝'}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium capitalize">{interaction.type}</span>
                <span className="text-slate-400 text-sm">
                  {new Date(interaction.date).toLocaleDateString()}
                </span>
              </div>
              {interaction.summary && (
                <p className="text-slate-300 text-sm mt-1">{interaction.summary}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
