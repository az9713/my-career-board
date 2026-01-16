'use client'

import { useState } from 'react'

interface Context {
  id: string
  type: 'resume' | 'linkedin' | 'document' | 'notes'
  name: string
  summary: string
  createdAt: string
}

interface ContextCardProps {
  context: Context
  onDelete: (id: string) => void
}

const typeIcons: Record<string, string> = {
  resume: '📄',
  linkedin: '💼',
  document: '📋',
  notes: '📝',
}

const typeColors: Record<string, string> = {
  resume: 'bg-blue-500/20 text-blue-400',
  linkedin: 'bg-purple-500/20 text-purple-400',
  document: 'bg-green-500/20 text-green-400',
  notes: 'bg-yellow-500/20 text-yellow-400',
}

export function ContextCard({ context, onDelete }: ContextCardProps) {
  const [expanded, setExpanded] = useState(false)

  const truncatedSummary = context.summary && context.summary.length > 200
    ? context.summary.slice(0, 200) + '...'
    : context.summary

  const formattedDate = new Date(context.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span
            data-testid={`context-icon-${context.type}`}
            className="text-xl"
          >
            {typeIcons[context.type] || '📄'}
          </span>
          <div>
            <h4 className="text-white font-medium">{context.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[context.type]}`}>
                {context.type}
              </span>
              <span className="text-xs text-slate-500">{formattedDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-slate-700 transition-colors"
            aria-label={expanded ? 'Collapse' : 'View details'}
          >
            {expanded ? 'Collapse' : 'View'}
          </button>
          <button
            onClick={() => onDelete(context.id)}
            className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
            aria-label="Delete context"
          >
            Delete
          </button>
        </div>
      </div>

      {context.summary && (
        <p
          data-testid="context-summary"
          className="mt-3 text-sm text-slate-400"
        >
          {expanded ? context.summary : truncatedSummary}
        </p>
      )}

      {expanded && (
        <div data-testid="context-expanded" className="mt-4 pt-4 border-t border-slate-700">
          <div className="text-xs text-slate-500">
            Full details and parsed data available in settings.
          </div>
        </div>
      )}
    </div>
  )
}
