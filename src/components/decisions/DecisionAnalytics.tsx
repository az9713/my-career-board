'use client'

interface DecisionAnalyticsData {
  totalDecisions: number
  averageAccuracy: number | null
  decisionsByStatus: Record<string, number>
  decisionsByCategory: Record<string, number>
  recentDecisions: any[]
}

interface DecisionAnalyticsProps {
  analytics: DecisionAnalyticsData
}

export function DecisionAnalytics({ analytics }: DecisionAnalyticsProps) {
  const formatCategoryLabel = (category: string) => {
    return category
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-3xl font-bold text-white">{analytics.totalDecisions}</div>
          <div className="text-sm text-slate-400">Total Decisions</div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          {analytics.averageAccuracy !== null ? (
            <>
              <div className="text-3xl font-bold text-white">
                {analytics.averageAccuracy.toFixed(1)}
              </div>
              <div className="text-sm text-slate-400">Avg Accuracy</div>
            </>
          ) : (
            <>
              <div className="text-lg text-slate-500">No data yet</div>
              <div className="text-sm text-slate-400">Avg Accuracy</div>
            </>
          )}
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <h4 className="text-sm font-medium text-slate-300 mb-3">By Status</h4>
        <div className="space-y-2">
          {Object.entries(analytics.decisionsByStatus).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between">
              <span className="text-slate-400 capitalize">{status}</span>
              <span className="text-white font-medium">{count}</span>
            </div>
          ))}
          {Object.keys(analytics.decisionsByStatus).length === 0 && (
            <div className="text-slate-500 text-sm">No decisions yet</div>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <h4 className="text-sm font-medium text-slate-300 mb-3">By Category</h4>
        <div className="space-y-2">
          {Object.entries(analytics.decisionsByCategory).map(([category, count]) => (
            <div key={category} className="flex items-center justify-between">
              <span className="text-slate-400">{formatCategoryLabel(category)}</span>
              <span className="text-white font-medium">{count}</span>
            </div>
          ))}
          {Object.keys(analytics.decisionsByCategory).length === 0 && (
            <div className="text-slate-500 text-sm">No categories yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
