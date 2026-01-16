'use client'

import { useState } from 'react'

interface EvidenceCaptureProps {
  onSuccess: () => void
  initialType?: string
}

export function EvidenceCapture({ onSuccess, initialType = '' }: EvidenceCaptureProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState(initialType)
  const [impact, setImpact] = useState('')
  const [source, setSource] = useState('')
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
      setError('Type is required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          type,
          impact: impact.trim() || undefined,
          source: source || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save evidence')
      }

      // Reset form
      setTitle('')
      setDescription('')
      setType('')
      setImpact('')
      setSource('')
      onSuccess()
    } catch (err) {
      setError('Failed to save evidence. Please try again.')
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
          placeholder="What did you accomplish?"
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
          <option value="">Select type...</option>
          <option value="win">Win</option>
          <option value="feedback">Feedback</option>
          <option value="metric">Metric</option>
          <option value="artifact">Artifact</option>
          <option value="milestone">Milestone</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
          rows={3}
          placeholder="Add more details..."
        />
      </div>

      <div>
        <label htmlFor="impact" className="block text-sm font-medium text-slate-300 mb-1">
          Impact
        </label>
        <input
          id="impact"
          type="text"
          value={impact}
          onChange={(e) => setImpact(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
          placeholder="What was the result or impact?"
        />
      </div>

      <div>
        <label htmlFor="source" className="block text-sm font-medium text-slate-300 mb-1">
          Source
        </label>
        <select
          id="source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="">Select source...</option>
          <option value="self">Self</option>
          <option value="manager">Manager</option>
          <option value="peer">Peer</option>
          <option value="customer">Customer</option>
          <option value="performance-review">Performance Review</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        {loading ? 'Saving...' : 'Save Evidence'}
      </button>
    </form>
  )
}
