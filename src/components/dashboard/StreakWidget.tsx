'use client'

interface StreakWidgetProps {
  current: number
  longest: number
}

export function StreakWidget({ current, longest }: StreakWidgetProps) {
  const isMilestone = current > 0 && (current === 4 || current === 10 || current === 26 || current === 52)
  const weekText = current === 1 ? 'week streak' : 'week streak'

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex items-center gap-3">
        {/* Flame icon */}
        {current > 0 ? (
          <div
            data-testid="streak-flame"
            className="text-3xl"
            role="img"
            aria-label="Fire"
          >
            🔥
          </div>
        ) : (
          <div className="text-3xl opacity-50">❄️</div>
        )}

        <div className="flex-1">
          {current > 0 ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{current}</span>
                <span className="text-slate-400">{weekText}</span>
              </div>
              <div className="text-sm text-slate-500">
                Longest: {longest}
              </div>
            </>
          ) : (
            <div className="text-slate-400">
              Start your streak by completing a check-in!
            </div>
          )}
        </div>

        {/* Milestone badge */}
        {isMilestone && (
          <div
            data-testid="streak-milestone"
            className="bg-yellow-600/20 text-yellow-500 px-2 py-1 rounded text-xs font-medium"
          >
            🎉 Milestone!
          </div>
        )}
      </div>

      {/* Progress bar to next milestone */}
      {current > 0 && !isMilestone && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{current} weeks</span>
            <span>Next milestone: {getNextMilestone(current)}</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all"
              style={{ width: `${getProgressToMilestone(current)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function getNextMilestone(current: number): number {
  const milestones = [4, 10, 26, 52]
  for (const milestone of milestones) {
    if (current < milestone) return milestone
  }
  return current + 52 // Next year
}

function getProgressToMilestone(current: number): number {
  const milestones = [0, 4, 10, 26, 52]
  let prevMilestone = 0

  for (let i = 1; i < milestones.length; i++) {
    if (current < milestones[i]) {
      prevMilestone = milestones[i - 1]
      const nextMilestone = milestones[i]
      return ((current - prevMilestone) / (nextMilestone - prevMilestone)) * 100
    }
  }

  return 100
}
