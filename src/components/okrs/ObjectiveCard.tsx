'use client'

import { useState } from 'react'

interface KeyResult {
  id: string
  title: string
  progress: number
}

interface ObjectiveCardProps {
  objective: {
    id: string
    title: string
    description?: string
    category: string
    progress: number
    status: string
    keyResults: KeyResult[]
  }
  onEdit?: (objective: any) => void
}

const statusColors: Record<string, string> = {
  'on-track': 'bg-green-500/20 text-green-300',
  'at-risk': 'bg-yellow-500/20 text-yellow-300',
  behind: 'bg-red-500/20 text-red-300',
  completed: 'bg-blue-500/20 text-blue-300',
}

const categoryColors: Record<string, string> = {
  growth: 'text-purple-400',
  impact: 'text-blue-400',
  learning: 'text-green-400',
  leadership: 'text-yellow-400',
  wellness: 'text-pink-400',
}

export function ObjectiveCard({ objective, onEdit }: ObjectiveCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white">{objective.title}</h3>
            <span className={`text-sm capitalize ${categoryColors[objective.category] || 'text-slate-400'}`}>
              {objective.category}
            </span>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[objective.status] || 'bg-slate-500/20 text-slate-300'}`}>
            {objective.status}
          </span>
        </div>

        {objective.description && (
          <p className="text-slate-400 text-sm mb-3">{objective.description}</p>
        )}

        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${objective.progress}%` }}
            />
          </div>
          <span className="text-white font-medium">{objective.progress}%</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-medium"
          >
            {expanded ? 'Collapse' : 'Expand'} ({objective.keyResults.length} KRs)
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(objective)}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-medium"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {expanded && objective.keyResults.length > 0 && (
        <div className="border-t border-slate-700 bg-slate-900/50 p-4 space-y-2">
          {objective.keyResults.map((kr) => (
            <div key={kr.id} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-white text-sm">{kr.title}</div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${kr.progress}%` }}
                  />
                </div>
              </div>
              <span className="text-slate-400 text-sm">{kr.progress}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
