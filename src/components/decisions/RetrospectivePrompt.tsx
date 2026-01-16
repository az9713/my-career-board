'use client'

interface Decision {
  id: string
  title: string
  decidedAt?: string | null
  prediction?: string | null
}

interface RetrospectivePromptProps {
  decision: Decision
  onComplete: () => void
}

export function RetrospectivePrompt({ decision, onComplete }: RetrospectivePromptProps) {
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 1) return 'today'
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  return (
    <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg border border-blue-700/50 p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🔮</span>
        <h3 className="text-lg font-medium text-white">Time to Reflect</h3>
      </div>

      <div className="mb-4">
        <h4 className="text-xl font-semibold text-white mb-1">{decision.title}</h4>
        {decision.decidedAt && (
          <p className="text-sm text-slate-400">
            Decided {getTimeAgo(decision.decidedAt)}
          </p>
        )}
      </div>

      {decision.prediction && (
        <div className="mb-4 p-3 bg-slate-800/50 rounded-lg">
          <div className="text-xs text-slate-400 mb-1">Your Prediction:</div>
          <div className="text-slate-300">{decision.prediction}</div>
        </div>
      )}

      <div className="space-y-2 text-sm text-slate-300 mb-4">
        <p>Take a moment to reflect on this decision:</p>
        <ul className="list-disc list-inside space-y-1 text-slate-400">
          <li>Did things turn out as expected?</li>
          <li>What surprised you?</li>
          <li>What would you do differently?</li>
        </ul>
      </div>

      <button
        onClick={onComplete}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        Record Outcome
      </button>
    </div>
  )
}
