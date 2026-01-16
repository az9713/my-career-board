'use client'

interface OKRAnalyticsProps {
  analytics: {
    activePeriods: number
    totalObjectives: number
    statusBreakdown: Record<string, number>
    averageProgress: number
    totalKeyResults: number
    completedKeyResults: number
    keyResultCompletionRate: number
  }
}

const statusColors: Record<string, string> = {
  'on-track': 'bg-green-500',
  'at-risk': 'bg-yellow-500',
  behind: 'bg-red-500',
  completed: 'bg-blue-500',
}

export function OKRAnalytics({ analytics }: OKRAnalyticsProps) {
  const {
    activePeriods,
    totalObjectives,
    statusBreakdown,
    averageProgress,
    totalKeyResults,
    completedKeyResults,
    keyResultCompletionRate,
  } = analytics

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-3xl font-bold text-white">{activePeriods}</div>
          <div className="text-sm text-slate-400">Active Periods</div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-3xl font-bold text-white">{totalObjectives}</div>
          <div className="text-sm text-slate-400">Total Objectives</div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-3xl font-bold text-blue-400">{averageProgress}%</div>
          <div className="text-sm text-slate-400">Average Progress</div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-3xl font-bold text-green-400">{keyResultCompletionRate}%</div>
          <div className="text-sm text-slate-400">KR Completion</div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h3 className="text-lg font-medium text-white mb-4">Objectives by Status</h3>
        <div className="space-y-3">
          {Object.entries(statusBreakdown).map(([status, count]) => {
            const percentage = totalObjectives > 0 ? (count / totalObjectives) * 100 : 0
            return (
              <div key={status}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300 capitalize">{status}</span>
                  <span className="text-white font-medium">{count}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${statusColors[status] || 'bg-slate-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Key Results Summary */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h3 className="text-lg font-medium text-white mb-4">Key Results</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{totalKeyResults}</div>
            <div className="text-sm text-slate-400">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{completedKeyResults}</div>
            <div className="text-sm text-slate-400">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-400">{totalKeyResults - completedKeyResults}</div>
            <div className="text-sm text-slate-400">In Progress</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-green-500"
              style={{ width: `${keyResultCompletionRate}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>{completedKeyResults} completed</span>
            <span>{totalKeyResults - completedKeyResults} remaining</span>
          </div>
        </div>
      </div>
    </div>
  )
}
