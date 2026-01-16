'use client'

import { useState, useEffect } from 'react'

interface LearningResource {
  id: string
  title: string
  type: string
  provider?: string
  url?: string
  status: string
  progress: number
  hoursSpent?: number
  rating?: number
}

const typeIcons: Record<string, string> = {
  course: '📚',
  book: '📖',
  video: '🎬',
  article: '📄',
  tutorial: '💻',
  podcast: '🎙️',
}

const statusColors: Record<string, string> = {
  not_started: 'bg-slate-500/20 text-slate-300',
  in_progress: 'bg-blue-500/20 text-blue-300',
  completed: 'bg-green-500/20 text-green-300',
  paused: 'bg-yellow-500/20 text-yellow-300',
}

export function LearningResources() {
  const [resources, setResources] = useState<LearningResource[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    async function fetchResources() {
      try {
        const url = filter
          ? `/api/learning/resources?status=${filter}`
          : '/api/learning/resources'
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setResources(data)
        }
      } catch (error) {
        console.error('Failed to fetch resources:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchResources()
  }, [filter])

  if (loading) {
    return <div className="text-slate-400">Loading resources...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Learning Resources</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
        >
          <option value="">All Status</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="space-y-3">
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="bg-slate-800 rounded-lg border border-slate-700 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{typeIcons[resource.type] || '📌'}</span>
                <div>
                  <h3 className="text-white font-medium">{resource.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-slate-400 capitalize">{resource.type}</span>
                    {resource.provider && (
                      <span className="text-sm text-slate-500">· {resource.provider}</span>
                    )}
                  </div>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  statusColors[resource.status] || statusColors.not_started
                }`}
              >
                {resource.status.replace('_', ' ')}
              </span>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Progress</span>
                <span className="text-white">{resource.progress}%</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${resource.progress}%` }}
                />
              </div>
            </div>

            {(resource.hoursSpent || resource.rating) && (
              <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
                {resource.hoursSpent && <span>{resource.hoursSpent}h spent</span>}
                {resource.rating && <span>{'⭐'.repeat(resource.rating)}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {resources.length === 0 && (
        <div className="text-center text-slate-400 py-8">
          No learning resources found
        </div>
      )}
    </div>
  )
}
