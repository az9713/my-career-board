'use client'

interface DecisionOutcome {
  accuracy: number | null
}

interface Decision {
  id: string
  title: string
  status: string
  createdAt: string
  outcome?: DecisionOutcome | null
}

interface DecisionTimelineProps {
  decisions: Decision[]
  onDecisionClick?: (decision: Decision) => void
}

export function DecisionTimeline({ decisions, onDecisionClick }: DecisionTimelineProps) {
  if (decisions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No decisions yet. Start by recording your first decision.
      </div>
    )
  }

  const getStatusIcon = (status: string, hasOutcome: boolean) => {
    if (status === 'closed' && hasOutcome) return '✓'
    if (status === 'decided') return '●'
    return '○'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'border-yellow-500 bg-yellow-500/20'
      case 'decided':
        return 'border-blue-500 bg-blue-500/20'
      case 'closed':
        return 'border-green-500 bg-green-500/20'
      default:
        return 'border-slate-500 bg-slate-500/20'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />

      <div className="space-y-4">
        {decisions.map((decision) => (
          <div
            key={decision.id}
            className="relative pl-10 cursor-pointer group"
            onClick={() => onDecisionClick?.(decision)}
          >
            {/* Timeline dot */}
            <div
              className={`absolute left-2 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] ${getStatusColor(decision.status)}`}
            >
              {getStatusIcon(decision.status, !!decision.outcome)}
            </div>

            {/* Content */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-3 group-hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium">{decision.title}</h4>
                <span className="text-xs text-slate-500">
                  {formatDate(decision.createdAt)}
                </span>
              </div>
              {decision.outcome?.accuracy && (
                <div className="mt-1 text-xs text-green-400">
                  Accuracy: {decision.outcome.accuracy}/5
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
