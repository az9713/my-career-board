'use client'

import { useState } from 'react'

interface Decision {
  id: string
  title: string
  prediction?: string | null
}

interface OutcomeRecorderProps {
  decision: Decision
  onSuccess: () => void
}

export function OutcomeRecorder({ decision, onSuccess }: OutcomeRecorderProps) {
  const [actualOutcome, setActualOutcome] = useState('')
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [lessonsLearned, setLessonsLearned] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!actualOutcome.trim()) {
      setError('Please describe what happened')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/decisions/${decision.id}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualOutcome: actualOutcome.trim(),
          accuracy,
          lessonsLearned: lessonsLearned.trim() || undefined,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to save outcome')
      }

      onSuccess()
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <h3 className="text-lg font-medium text-white mb-4">Record Outcome</h3>

      {decision.prediction && (
        <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
          <div className="text-xs text-slate-400 mb-1">Your Prediction:</div>
          <div className="text-slate-300">{decision.prediction}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-900/50 text-red-200 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="actualOutcome" className="block text-sm font-medium text-slate-300 mb-1">
            What happened?
          </label>
          <textarea
            id="actualOutcome"
            value={actualOutcome}
            onChange={(e) => setActualOutcome(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white min-h-[100px]"
            placeholder="Describe the actual outcome..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Accuracy of your prediction
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <label
                key={value}
                className={`flex-1 text-center py-2 rounded-lg cursor-pointer border transition-colors ${
                  accuracy === value
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                }`}
              >
                <input
                  type="radio"
                  name="accuracy"
                  value={value}
                  checked={accuracy === value}
                  onChange={() => setAccuracy(value)}
                  className="sr-only"
                  aria-label={`Accuracy ${value}`}
                />
                {value}
              </label>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Way off</span>
            <span>Spot on</span>
          </div>
        </div>

        <div>
          <label htmlFor="lessonsLearned" className="block text-sm font-medium text-slate-300 mb-1">
            Lessons learned
          </label>
          <textarea
            id="lessonsLearned"
            value={lessonsLearned}
            onChange={(e) => setLessonsLearned(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white min-h-[80px]"
            placeholder="What did you learn from this decision?"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Saving...' : 'Save Outcome'}
        </button>
      </form>
    </div>
  )
}
