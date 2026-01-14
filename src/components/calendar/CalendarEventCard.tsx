'use client'

import { useState } from 'react'

interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  startTime: string
  endTime: string
  type: string
}

interface CalendarEventCardProps {
  event: CalendarEvent
  onDelete?: (eventId: string) => void
}

const typeLabels: Record<string, string> = {
  quarterly_review: 'Quarterly Review',
  weekly_checkin: 'Weekly Check-in',
  bet_deadline: 'Bet Deadline',
  custom: 'Custom',
}

const typeColors: Record<string, string> = {
  quarterly_review: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  weekly_checkin: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  bet_deadline: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  custom: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

export function CalendarEventCard({ event, onDelete }: CalendarEventCardProps) {
  const [expanded, setExpanded] = useState(false)

  const startDate = new Date(event.startTime)
  const endDate = new Date(event.endTime)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h4 className="text-white font-medium">{event.title}</h4>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
              <span>{formatDate(startDate)}</span>
              <span>•</span>
              <span>{formatTime(startDate)}</span>
            </div>
          </div>

          <span
            className={`text-xs px-2 py-1 rounded border ${typeColors[event.type] || typeColors.custom}`}
          >
            {typeLabels[event.type] || 'Quarterly'}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'collapse' : 'expand'}
            className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>

          {onDelete && (
            <button
              onClick={() => onDelete(event.id)}
              aria-label="delete"
              className="text-sm text-red-400 hover:text-red-300 transition-colors ml-auto"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {expanded && event.description && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-700 mt-2">
          <p className="text-sm text-slate-400 pt-3">{event.description}</p>
        </div>
      )}
    </div>
  )
}
