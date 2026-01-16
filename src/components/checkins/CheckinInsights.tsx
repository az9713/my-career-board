'use client'

interface CheckinInsightsData {
  totalCheckins: number
  averageMood: number | null
  moodTrend: 'improving' | 'declining' | 'stable' | 'unknown'
  checkinsByDay: Record<string, number>
}

interface CheckinInsightsProps {
  insights: CheckinInsightsData
}

const trendLabels: Record<string, { label: string; color: string }> = {
  improving: { label: 'Improving', color: 'text-green-400' },
  declining: { label: 'Declining', color: 'text-red-400' },
  stable: { label: 'Stable', color: 'text-blue-400' },
  unknown: { label: 'Not enough data', color: 'text-slate-400' },
}

export function CheckinInsights({ insights }: CheckinInsightsProps) {
  const trend = trendLabels[insights.moodTrend]

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 text-center">
          <div className="text-3xl font-bold text-white">{insights.totalCheckins}</div>
          <div className="text-sm text-slate-400">Total Check-ins</div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 text-center">
          {insights.averageMood !== null ? (
            <>
              <div className="text-3xl font-bold text-white">
                {insights.averageMood.toFixed(1)}
              </div>
              <div className="text-sm text-slate-400">Avg Mood</div>
            </>
          ) : (
            <>
              <div className="text-xl text-slate-500">—</div>
              <div className="text-sm text-slate-400">No mood data</div>
            </>
          )}
        </div>
      </div>

      {/* Mood Trend */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Mood Trend</span>
          <span className={`font-medium ${trend.color}`}>{trend.label}</span>
        </div>
      </div>

      {/* Recent Activity */}
      {Object.keys(insights.checkinsByDay).length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <h4 className="text-sm text-slate-400 mb-3">Recent Activity</h4>
          <div className="flex gap-1">
            {Object.entries(insights.checkinsByDay)
              .slice(-7)
              .map(([day, count]) => (
                <div
                  key={day}
                  className={`
                    flex-1 h-8 rounded
                    ${count > 0 ? 'bg-green-600' : 'bg-slate-700'}
                  `}
                  title={`${day}: ${count} check-in${count !== 1 ? 's' : ''}`}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
