'use client'

import { useState } from 'react'

interface ResourceFormProps {
  resource?: any
  onSuccess: () => void
  onCancel?: () => void
}

export function ResourceForm({ resource, onSuccess, onCancel }: ResourceFormProps) {
  const [title, setTitle] = useState(resource?.title || '')
  const [type, setType] = useState(resource?.type || 'course')
  const [provider, setProvider] = useState(resource?.provider || '')
  const [url, setUrl] = useState(resource?.url || '')
  const [notes, setNotes] = useState(resource?.notes || '')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim() || !type) {
      setError('Title and type are required')
      return
    }

    setIsSubmitting(true)

    try {
      const apiUrl = resource
        ? `/api/learning/resources/${resource.id}`
        : '/api/learning/resources'
      const response = await fetch(apiUrl, {
        method: resource ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type,
          provider,
          url,
          notes,
        }),
      })

      if (response.ok) {
        onSuccess()
      } else {
        setError('Failed to save resource')
      }
    } catch (err) {
      setError('Failed to save resource')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded">{error}</div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., TypeScript Fundamentals"
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
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
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        >
          <option value="course">Course</option>
          <option value="book">Book</option>
          <option value="video">Video</option>
          <option value="article">Article</option>
          <option value="tutorial">Tutorial</option>
          <option value="podcast">Podcast</option>
        </select>
      </div>

      <div>
        <label htmlFor="provider" className="block text-sm font-medium text-slate-300 mb-1">
          Provider (Optional)
        </label>
        <input
          type="text"
          id="provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          placeholder="e.g., Udemy, Coursera"
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        />
      </div>

      <div>
        <label htmlFor="url" className="block text-sm font-medium text-slate-300 mb-1">
          URL (Optional)
        </label>
        <input
          type="url"
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://"
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
