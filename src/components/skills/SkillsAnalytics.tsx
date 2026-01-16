'use client'

interface CategoryData {
  count: number
  avgProficiency: number
  skills?: string[]
}

interface SkillsAnalyticsData {
  totalSkills: number
  averageProficiency: number
  byCategory: Record<string, CategoryData>
  openGaps: number
  closedGaps: number
  activeGoals: number
  completedGoals: number
  averageGoalProgress: number
}

interface SkillsAnalyticsProps {
  analytics: SkillsAnalyticsData
}

export function SkillsAnalytics({ analytics }: SkillsAnalyticsProps) {
  const categories = Object.entries(analytics.byCategory)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-3xl font-bold text-white">{analytics.totalSkills}</div>
          <div className="text-sm text-slate-400">Total Skills</div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-3xl font-bold text-white">{analytics.averageProficiency.toFixed(1)}</div>
          <div className="text-sm text-slate-400">Avg Proficiency</div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-3xl font-bold text-orange-400">{analytics.openGaps}</div>
          <div className="text-sm text-slate-400">Open Gaps</div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-3xl font-bold text-blue-400">{analytics.activeGoals}</div>
          <div className="text-sm text-slate-400">Active Goals</div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h3 className="text-lg font-medium text-white mb-4">Skills by Category</h3>
        <div className="space-y-4">
          {categories.map(([category, data]) => (
            <div key={category}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-300 capitalize">{category}</span>
                <div className="text-sm text-slate-400">
                  <span className="text-white font-medium">{data.count}</span> skills
                  {' · '}
                  <span className="text-white">{data.avgProficiency.toFixed(1)}</span> avg
                </div>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(data.avgProficiency / 5) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="text-slate-500 text-sm">No skills data yet</div>
          )}
        </div>
      </div>

      {/* Goals Progress */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h3 className="text-lg font-medium text-white mb-4">Goals Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-slate-400">Active</span>
              <span className="text-white">{analytics.activeGoals}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Completed</span>
              <span className="text-green-400">{analytics.completedGoals}</span>
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-400 mb-1">Avg Progress</div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${analytics.averageGoalProgress}%` }}
              />
            </div>
            <div className="text-right text-sm text-white mt-1">
              {analytics.averageGoalProgress}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
