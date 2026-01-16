'use client'

interface SkillGap {
  id: string
  skillName: string
  currentLevel: number | null
  requiredLevel: number
  gapSize: number
  priority: string
  source: string
  targetRole?: string | null
}

interface SkillGapCardProps {
  gap: SkillGap
  onAction?: (gap: SkillGap) => void
}

export function SkillGapCard({ gap, onAction }: SkillGapCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/20 text-red-300'
      case 'high':
        return 'bg-orange-500/20 text-orange-300'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300'
      case 'low':
        return 'bg-green-500/20 text-green-300'
      default:
        return 'bg-slate-500/20 text-slate-300'
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'market-demand':
        return 'Market Demand'
      case 'job-target':
        return 'Target Role'
      case 'self-identified':
        return 'Self-identified'
      default:
        return source
    }
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-medium text-white">{gap.skillName}</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(gap.priority)}`}>
          {gap.priority}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
        <div>
          <div className="text-slate-400">Current</div>
          <div className="text-white">{gap.currentLevel ?? 'None'}</div>
        </div>
        <div>
          <div className="text-slate-400">Required</div>
          <div className="text-white">{gap.requiredLevel}/5</div>
        </div>
        <div>
          <div className="text-slate-400">Gap</div>
          <div className="text-orange-400 font-medium">+{gap.gapSize}</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">{getSourceLabel(gap.source)}</span>
        {gap.targetRole && (
          <span className="text-slate-400">For: {gap.targetRole}</span>
        )}
      </div>

      {onAction && (
        <button
          onClick={() => onAction(gap)}
          className="mt-3 w-full bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Create Learning Plan
        </button>
      )}
    </div>
  )
}
