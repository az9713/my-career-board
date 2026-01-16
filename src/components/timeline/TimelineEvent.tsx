'use client'

interface TimelineEventData {
  id: string
  title: string
  type: string
  description?: string | null
  date: string
  importance: number
  inflectionPoint?: { impact: string } | null
}

interface TimelineEventProps {
  event: TimelineEventData
  onClick?: () => void
}

export function TimelineEvent({ event, onClick }: TimelineEventProps) {
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
        return 'bg-blue-500/20 text-blue-300'
      case 'milestone':
        return 'bg-green-500/20 text-green-300'
      case 'decision':
        return 'bg-purple-500/20 text-purple-300'
      case 'bet':
        return 'bg-yellow-500/20 text-yellow-300'
      default:
        return 'bg-slate-500/20 text-slate-300'
    }
  }

  const renderImportanceIndicator = () => {
    const dots = []
    for (let i = 0; i < 5; i++) {
      dots.push(
        <span
          key={i}
          className={`w-2 h-2 rounded-full ${i < event.importance ? 'bg-blue-500' : 'bg-slate-600'}`}
        />
      )
    }
    return dots
  }

  return (
    <div
      className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-slate-600 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-medium text-white">{event.title}</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(event.type)}`}>
          {event.type}
        </span>
      </div>

      {event.description && (
        <p className="text-slate-400 text-sm mb-3">{event.description}</p>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">{formatDate(event.date)}</span>
        <div className="flex items-center gap-1" data-testid="importance-indicator">
          {renderImportanceIndicator()}
        </div>
      </div>
    </div>
  )
}
