'use client'

import { useState } from 'react'

interface SkillGoal {
  id: string
  skillName: string
  targetLevel: number
  progress: number
  status: string
  deadline?: string | null
  reason?: string | null
}

interface SkillGoalCardProps {
  goal: SkillGoal
  onProgressUpdate?: (goalId: string, progress: number) => void
}

export function SkillGoalCard({ goal, onProgressUpdate }: SkillGoalCardProps) {
  const [showProgressInput, setShowProgressInput] = useState(false)
  const [newProgress, setNewProgress] = useState(goal.progress)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-500/20 text-blue-300'
      case 'completed':
        return 'bg-green-500/20 text-green-300'
      case 'abandoned':
        return 'bg-red-500/20 text-red-300'
      default:
        return 'bg-slate-500/20 text-slate-300'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const handleProgressUpdate = async () => {
    if (onProgressUpdate) {
      onProgressUpdate(goal.id, newProgress)
    }
    setShowProgressInput(false)
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-medium text-white">{goal.skillName}</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(goal.status)}`}>
          {goal.status}
        </span>
      </div>

      {goal.reason && (
        <p className="text-sm text-slate-400 mb-3">{goal.reason}</p>
      )}

      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-slate-400">Progress</span>
          <span className="text-white font-medium">{goal.progress}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${goal.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm mb-3">
        <span className="text-slate-400">Target: Level {goal.targetLevel}/5</span>
        {goal.deadline && (
          <span className="text-slate-500">Due: {formatDate(goal.deadline)}</span>
        )}
      </div>

      {goal.status === 'active' && onProgressUpdate && (
        <>
          {showProgressInput ? (
            <div className="flex gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={newProgress}
                onChange={(e) => setNewProgress(parseInt(e.target.value))}
                className="flex-1"
              />
              <button
                onClick={handleProgressUpdate}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowProgressInput(true)}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white text-sm py-2 px-4 rounded-lg transition-colors"
            >
              Update Progress
            </button>
          )}
        </>
      )}
    </div>
  )
}
