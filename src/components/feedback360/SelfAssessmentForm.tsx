'use client'

import { useState } from 'react'

interface SelfAssessmentFormProps {
  onSuccess: () => void
}

const CATEGORIES = [
  { value: 'leadership', label: 'Leadership' },
  { value: 'communication', label: 'Communication' },
  { value: 'technical', label: 'Technical' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'problem-solving', label: 'Problem Solving' },
]

export function SelfAssessmentForm({ onSuccess }: SelfAssessmentFormProps) {
  const [category, setCategory] = useState('')
  const [area, setArea] = useState('')
  const [rating, setRating] = useState(3)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!category || !area.trim()) {
      setError('Category and area are required')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/feedback/self-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          area: area.trim(),
          rating,
          notes: notes.trim() || undefined,
        }),
      })

      if (!res.ok) throw new Error('Failed to save')

      setCategory('')
      setArea('')
      setRating(3)
      setNotes('')
      onSuccess()
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-900/50 text-red-200 p-3 rounded-lg text-sm">{error}</div>
      )}

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-1">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="">Select category</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="area" className="block text-sm font-medium text-slate-300 mb-1">
          Area
        </label>
        <input
          id="area"
          type="text"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
          placeholder="e.g., Decision making, Public speaking"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Rating: {rating}/5
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className={`flex-1 py-2 rounded-lg border transition-colors ${
                rating === value
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white min-h-[60px]"
          placeholder="Any additional thoughts..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg"
      >
        {loading ? 'Saving...' : 'Save Assessment'}
      </button>
    </form>
  )
}
