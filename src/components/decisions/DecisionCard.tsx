'use client'

interface DecisionTag {
  tag: string
}

interface DecisionOutcome {
  accuracy: number | null
  actualOutcome: string
}

interface Decision {
  id: string
  title: string
  description?: string | null
  status: string
  category?: string | null
  options?: string | null
  prediction?: string | null
  confidence?: number | null
  createdAt: string
  tags?: DecisionTag[]
  outcome?: DecisionOutcome | null
}

interface DecisionCardProps {
  decision: Decision
  onEdit?: (decision: Decision) => void
  onClick?: () => void
}

export function DecisionCard({ decision, onEdit, onClick }: DecisionCardProps) {
  const parsedOptions = decision.options ? JSON.parse(decision.options) : []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300'
      case 'decided':
        return 'bg-blue-500/20 text-blue-300'
      case 'closed':
        return 'bg-green-500/20 text-green-300'
      default:
        return 'bg-slate-500/20 text-slate-300'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div
      className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-slate-600 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-medium text-white">{decision.title}</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(decision.status)}`}>
          {decision.status}
        </span>
      </div>

      {decision.description && (
        <p className="text-slate-400 text-sm mb-3">{decision.description}</p>
      )}

      {parsedOptions.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-slate-500 mb-1">Options:</div>
          <div className="flex flex-wrap gap-1">
            {parsedOptions.map((option: string, index: number) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300"
              >
                {option}
              </span>
            ))}
          </div>
        </div>
      )}

      {decision.confidence && (
        <div className="mb-3 text-sm text-slate-400">
          Confidence: {decision.confidence}/5
        </div>
      )}

      {decision.tags && decision.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {decision.tags.map((tagObj, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs"
            >
              {tagObj.tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{formatDate(decision.createdAt)}</span>
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(decision)
            }}
            className="text-blue-400 hover:text-blue-300"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  )
}
