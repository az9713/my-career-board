'use client'

interface Evidence {
  id: string
  title: string
  type: string
  date: string
  description?: string
}

interface EvidenceTimelineProps {
  evidence: Evidence[]
  onEventClick?: (evidence: Evidence) => void
}

const typeColors: Record<string, string> = {
  win: 'bg-green-500',
  feedback: 'bg-blue-500',
  metric: 'bg-purple-500',
  artifact: 'bg-orange-500',
  milestone: 'bg-yellow-500',
}

export function EvidenceTimeline({ evidence, onEventClick }: EvidenceTimelineProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (evidence.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-lg">No evidence to display</p>
        <p className="text-sm mt-2">Start documenting your career journey!</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />

      {/* Events */}
      <div className="space-y-6">
        {evidence.map((item) => (
          <div
            key={item.id}
            data-testid="timeline-event"
            className="relative pl-10 cursor-pointer"
            onClick={() => onEventClick?.(item)}
          >
            {/* Dot */}
            <div
              className={`absolute left-2.5 w-3 h-3 rounded-full ${
                typeColors[item.type] || 'bg-slate-500'
              } ring-4 ring-slate-900`}
            />

            {/* Content */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-slate-600 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-500">
                  {formatDate(item.date)}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium text-white ${
                    typeColors[item.type] || 'bg-slate-600'
                  }`}
                >
                  {item.type}
                </span>
              </div>

              <h3 className="text-white font-medium">{item.title}</h3>

              {item.description && (
                <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
