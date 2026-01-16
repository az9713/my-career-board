'use client'

import { useState } from 'react'
import { MoodSelector } from './MoodSelector'

interface Prompt {
  id: string
  question: string
  category: string
}

interface DailyCheckinCardProps {
  prompt: Prompt
  onSubmit: () => void
}

export function DailyCheckinCard({ prompt, onSubmit }: DailyCheckinCardProps) {
  const [response, setResponse] = useState('')
  const [mood, setMood] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!response.trim()) {
      setError('Please enter a response')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptId: prompt.id,
          response: response.trim(),
          mood,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to submit check-in')
      }

      setResponse('')
      setMood(null)
      onSubmit()
    } catch (err) {
      setError('Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <h3 className="text-lg font-medium text-white mb-4">{prompt.question}</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-900/50 text-red-200 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white min-h-[100px]"
          placeholder="Share your thoughts..."
        />

        <div>
          <label className="block text-sm text-slate-400 mb-2">
            How are you feeling?
          </label>
          <MoodSelector value={mood} onChange={setMood} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Check-in'}
        </button>
      </form>
    </div>
  )
}
