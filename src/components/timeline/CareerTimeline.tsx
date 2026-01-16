'use client'

interface InflectionPoint {
  impact: string
}

interface TimelineEventData {
  id: string
  title: string
  type: string
  date: string
  importance: number
  inflectionPoint?: InflectionPoint | null
}

interface CareerPhase {
  id: string
  title: string
  startDate: string
  endDate: string | null
  color: string
}

interface CareerTimelineProps {
  events: TimelineEventData[]
  phases: CareerPhase[]
  onEventClick?: (event: TimelineEventData) => void
}

export function CareerTimeline({ events, phases, onEventClick }: CareerTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No events yet. Add your first career event to start building your timeline.
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'job':
        return 'border-blue-500 bg-blue-500/20'
      case 'milestone':
        return 'border-green-500 bg-green-500/20'
      case 'decision':
        return 'border-purple-500 bg-purple-500/20'
      case 'bet':
        return 'border-yellow-500 bg-yellow-500/20'
      default:
        return 'border-slate-500 bg-slate-500/20'
    }
  }

  return (
    <div className="relative">
      {/* Phases as background */}
      {phases.map((phase) => (
        <div
          key={phase.id}
          className="mb-2 px-3 py-1 rounded text-sm"
          style={{ backgroundColor: `${phase.color}20`, borderLeft: `3px solid ${phase.color}` }}
        >
          {phase.title}
        </div>
      ))}

      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />

      <div className="space-y-4 pt-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="relative pl-10 cursor-pointer group"
            onClick={() => onEventClick?.(event)}
          >
            {/* Timeline dot */}
            <div
              className={`absolute left-2 w-4 h-4 rounded-full border-2 ${getTypeColor(event.type)}`}
            />

            {/* Inflection point indicator */}
            {event.inflectionPoint && (
              <div
                data-testid={`inflection-point-${event.id}`}
                className="absolute left-0 w-8 h-8 rounded-full border-2 border-yellow-400 bg-yellow-400/10 -top-2 flex items-center justify-center"
              >
                <span className="text-xs">⚡</span>
              </div>
            )}

            {/* Content */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-3 group-hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium">{event.title}</h4>
                <span className="text-xs text-slate-500">{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 capitalize">
                  {event.type}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
