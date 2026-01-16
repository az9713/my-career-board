'use client'

import { useState } from 'react'

interface AddEventFormProps {
  onSuccess: () => void
}

const EVENT_TYPES = [
  { value: '', label: 'Select type' },
  { value: 'job', label: 'Job' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'decision', label: 'Decision' },
  { value: 'bet', label: 'Bet' },
]

export function AddEventForm({ onSuccess }: AddEventFormProps) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [importance, setImportance] = useState(3)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (!type) {
      setError('Please select an event type')
      return
    }

    if (!date) {
      setError('Please select a date')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          type,
          date: new Date(date).toISOString(),
          description: description.trim() || undefined,
          importance,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to add event')
      }

      setTitle('')
      setType('')
      setDate('')
      setDescription('')
      setImportance(3)
      onSuccess()
    } catch (err) {
      setError('Failed to add event. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-900/50 text-red-200 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
          placeholder="Event title"
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-slate-300 mb-1">
          Type
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          {EVENT_TYPES.map((eventType) => (
            <option key={eventType.value} value={eventType.value}>
              {eventType.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-1">
          Date
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white min-h-[80px]"
          placeholder="Event description (optional)"
        />
      </div>

      <div>
        <label htmlFor="importance" className="block text-sm font-medium text-slate-300 mb-1">
          Importance: {importance}/5
        </label>
        <input
          id="importance"
          type="range"
          min="1"
          max="5"
          value={importance}
          onChange={(e) => setImportance(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        {loading ? 'Adding...' : 'Add Event'}
      </button>
    </form>
  )
}
