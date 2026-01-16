'use client'

interface Comparison {
  category: string
  selfRating: number | null
  peerAverage: number
  gap: number | null
  insight: string
}

interface FeedbackComparisonProps {
  comparison: {
    comparisons: Comparison[]
    summary: {
      overestimatedAreas: number
      underestimatedAreas: number
      alignedAreas: number
    }
  }
}

export function FeedbackComparison({ comparison }: FeedbackComparisonProps) {
  const getInsightColor = (insight: string) => {
    switch (insight) {
      case 'overestimating':
        return 'text-yellow-400'
      case 'underestimating':
        return 'text-blue-400'
      case 'aligned':
        return 'text-green-400'
      default:
        return 'text-slate-400'
    }
  }

  const getInsightIcon = (insight: string) => {
    switch (insight) {
      case 'overestimating':
        return '↑'
      case 'underestimating':
        return '↓'
      case 'aligned':
        return '='
      default:
        return '?'
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-900/30 rounded-lg border border-yellow-700/50 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {comparison.summary.overestimatedAreas}
          </div>
          <div className="text-sm text-slate-400">Overestimating</div>
        </div>
        <div className="bg-green-900/30 rounded-lg border border-green-700/50 p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {comparison.summary.alignedAreas}
          </div>
          <div className="text-sm text-slate-400">Aligned</div>
        </div>
        <div className="bg-blue-900/30 rounded-lg border border-blue-700/50 p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {comparison.summary.underestimatedAreas}
          </div>
          <div className="text-sm text-slate-400">Underestimating</div>
        </div>
      </div>

      {/* Detail Comparisons */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 divide-y divide-slate-700">
        {comparison.comparisons.map((item) => (
          <div key={item.category} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium capitalize">{item.category}</span>
              <span className={`text-sm font-medium ${getInsightColor(item.insight)}`}>
                {getInsightIcon(item.insight)} {item.insight}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-slate-400">Self Rating</div>
                <div className="text-white">
                  {item.selfRating !== null ? `${item.selfRating}/5` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Peer Average</div>
                <div className="text-white">{item.peerAverage}/5</div>
              </div>
              <div>
                <div className="text-slate-400">Gap</div>
                <div className={item.gap && item.gap > 0 ? 'text-yellow-400' : item.gap && item.gap < 0 ? 'text-blue-400' : 'text-green-400'}>
                  {item.gap !== null ? (item.gap > 0 ? `+${item.gap}` : item.gap) : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
