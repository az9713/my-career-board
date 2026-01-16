'use client'

import { useState, useEffect } from 'react'
import { ContextCard } from './ContextCard'

interface Context {
  id: string
  type: 'resume' | 'linkedin' | 'document' | 'notes'
  name: string
  summary: string
  createdAt: string
}

export function ContextList() {
  const [contexts, setContexts] = useState<Context[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContexts = async () => {
    try {
      const response = await fetch('/api/context')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch')
      }

      setContexts(data.contexts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContexts()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/context?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete')
      }

      setContexts((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-slate-700 rounded"></div>
          <div className="h-20 bg-slate-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-red-400">
        {error}
      </div>
    )
  }

  if (contexts.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 text-center">
        <p className="text-slate-400">No context added yet.</p>
        <p className="text-sm text-slate-500 mt-1">
          Add your resume, LinkedIn profile, or other documents to give directors more context.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">Your Context ({contexts.length})</h3>
      <div className="grid gap-4">
        {contexts.map((context) => (
          <ContextCard
            key={context.id}
            context={context}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  )
}
