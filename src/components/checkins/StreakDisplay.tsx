'use client'

interface StreakDisplayProps {
  currentStreak: number
  longestStreak: number
  showMilestone?: boolean
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  showMilestone = false,
}: StreakDisplayProps) {
  const getMilestoneMessage = () => {
    if (currentStreak >= 30) return '🏆 Month streak!'
    if (currentStreak >= 7) return '🎉 Week streak!'
    if (currentStreak >= 3) return '👍 3 day streak!'
    return null
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">
            {currentStreak > 0 ? '🔥' : '❄️'}
          </span>
          <div>
            <div className="text-2xl font-bold text-white">{currentStreak}</div>
            <div className="text-sm text-slate-400">day streak</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-slate-400">Best: {longestStreak} days</div>
        </div>
      </div>

      {showMilestone && getMilestoneMessage() && (
        <div className="mt-3 pt-3 border-t border-slate-700 text-center text-sm text-slate-300">
          {getMilestoneMessage()}
        </div>
      )}
    </div>
  )
}
