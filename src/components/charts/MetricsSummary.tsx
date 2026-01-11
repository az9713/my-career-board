'use client'

interface MetricsData {
  betAccuracy: number
  totalBets: number
  sessionsCompleted: number
  currentStreak: number
  topAvoidance?: string
}

interface MetricsSummaryProps {
  metrics: MetricsData
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 70) return 'text-green-500'
  if (accuracy >= 50) return 'text-yellow-500'
  return 'text-red-500'
}

function getAccuracyBgColor(accuracy: number): string {
  if (accuracy >= 70) return 'bg-green-500/10'
  if (accuracy >= 50) return 'bg-yellow-500/10'
  return 'bg-red-500/10'
}

export function MetricsSummary({ metrics }: MetricsSummaryProps) {
  const {
    betAccuracy,
    totalBets,
    sessionsCompleted,
    currentStreak,
    topAvoidance,
  } = metrics

  return (
    <div data-testid="metrics-summary" className="bg-slate-800 rounded-lg p-6">
      <h3 className="text-lg font-medium text-white mb-4">Career Metrics</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Bet Accuracy */}
        <div className={`rounded-lg p-4 ${getAccuracyBgColor(betAccuracy)}`}>
          <div className="text-sm text-slate-400 mb-1">Bet Accuracy</div>
          <div
            data-testid="accuracy-metric"
            className={`text-2xl font-bold ${getAccuracyColor(betAccuracy)}`}
          >
            {betAccuracy}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {totalBets} total bets
          </div>
        </div>

        {/* Sessions Completed */}
        <div className="rounded-lg p-4 bg-blue-500/10">
          <div className="text-sm text-slate-400 mb-1">Sessions</div>
          <div className="text-2xl font-bold text-blue-500">
            {sessionsCompleted}
          </div>
          <div className="text-xs text-slate-500 mt-1">board meetings</div>
        </div>

        {/* Current Streak */}
        <div className="rounded-lg p-4 bg-purple-500/10">
          <div className="text-sm text-slate-400 mb-1">Current Streak</div>
          <div className="text-2xl font-bold text-purple-500">
            {currentStreak} week{currentStreak !== 1 ? 's' : ''}
          </div>
          <div className="text-xs text-slate-500 mt-1">consecutive</div>
        </div>

        {/* Total Bets */}
        <div className="rounded-lg p-4 bg-slate-700/50">
          <div className="text-sm text-slate-400 mb-1">Total Bets</div>
          <div className="text-2xl font-bold text-slate-300">{totalBets}</div>
          <div className="text-xs text-slate-500 mt-1">quarterly bets</div>
        </div>
      </div>

      {topAvoidance && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="text-sm text-slate-400 mb-2">Top Avoidance Pattern</div>
          <div className="flex items-center gap-2">
            <span className="text-orange-500">⚠</span>
            <span className="text-slate-300 capitalize">{topAvoidance}</span>
          </div>
        </div>
      )}
    </div>
  )
}
