'use client'

interface Objective {
  id: string
  title: string
  progress: number
  status: string
  keyResults: any[]
}

interface PeriodOverviewProps {
  period: {
    id: string
    name: string
    type: string
    status: string
    startDate: string
    endDate: string
    objectives: Objective[]
  }
  onSelect?: () => void
}

const statusColors: Record<string, string> = {
  planning: 'bg-slate-500/20 text-slate-300',
  active: 'bg-green-500/20 text-green-300',
  completed: 'bg-blue-500/20 text-blue-300',
  reviewed: 'bg-purple-500/20 text-purple-300',
}

export function PeriodOverview({ period, onSelect }: PeriodOverviewProps) {
  const totalKeyResults = period.objectives.reduce(
    (sum, obj) => sum + obj.keyResults.length,
    0
  )
  const averageProgress = period.objectives.length > 0
    ? Math.round(
        period.objectives.reduce((sum, obj) => sum + obj.progress, 0) /
          period.objectives.length
      )
    : 0

  const startDate = new Date(period.startDate)
  const endDate = new Date(period.endDate)
  const today = new Date()
  const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  const elapsedDays = Math.min(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    totalDays
  )
  const timeProgress = Math.max(0, Math.round((elapsedDays / totalDays) * 100))

  return (
    <button
      onClick={onSelect}
      className="w-full bg-slate-800 rounded-lg border border-slate-700 p-4 text-left hover:bg-slate-700/50 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-white">{period.name}</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${statusColors[period.status] || 'bg-slate-500/20 text-slate-300'}`}>
          {period.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-2xl font-bold text-white">{period.objectives.length}</div>
          <div className="text-xs text-slate-400">Objectives</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{totalKeyResults}</div>
          <div className="text-xs text-slate-400">Key Results</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-400">{averageProgress}%</div>
          <div className="text-xs text-slate-400">Progress</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">OKR Progress</span>
          <span className="text-white">{averageProgress}%</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${averageProgress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Time Elapsed</span>
          <span className="text-white">{timeProgress}%</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-slate-500 rounded-full"
            style={{ width: `${timeProgress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-500">
        2 objectives · {totalKeyResults} key results
      </div>
    </button>
  )
}
