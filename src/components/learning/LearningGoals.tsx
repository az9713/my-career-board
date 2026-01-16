'use client'

import { useState, useEffect } from 'react'

interface LearningGoal {
  id: string
  title: string
  description?: string
  targetDate: string
  progress: number
  status: string
  priority: string
}

const statusColors: Record<string, string> = {
  active: 'bg-blue-500/20 text-blue-300',
  completed: 'bg-green-500/20 text-green-300',
  paused: 'bg-yellow-500/20 text-yellow-300',
  cancelled: 'bg-slate-500/20 text-slate-300',
}

const priorityColors: Record<string, string> = {
  high: 'text-red-400',
  medium: 'text-yellow-400',
  low: 'text-slate-400',
}

export function LearningGoals() {
  const [goals, setGoals] = useState<LearningGoal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGoals() {
      try {
        const response = await fetch('/api/learning/goals')
        if (response.ok) {
          const data = await response.json()
          setGoals(data)
        }
      } catch (error) {
        console.error('Failed to fetch goals:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchGoals()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getDaysRemaining = (targetDate: string) => {
    const target = new Date(targetDate)
    const now = new Date()
    const days = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  if (loading) {
    return <div className="text-slate-400">Loading goals...</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Learning Goals</h2>

      <div className="space-y-3">
        {goals.map((goal) => {
          const daysRemaining = getDaysRemaining(goal.targetDate)

          return (
            <div
              key={goal.id}
              className="bg-slate-800 rounded-lg border border-slate-700 p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-white font-medium">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-sm text-slate-400 mt-1">{goal.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium capitalize ${priorityColors[goal.priority]}`}>
                    {goal.priority}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      statusColors[goal.status] || statusColors.active
                    }`}
                  >
                    {goal.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Progress</span>
                  <span className="text-white">{goal.progress}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      goal.progress >= 100
                        ? 'bg-green-500'
                        : goal.progress >= 50
                        ? 'bg-blue-500'
                        : 'bg-purple-500'
                    }`}
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 text-sm">
                <span className="text-slate-400">Target: {formatDate(goal.targetDate)}</span>
                <span
                  className={
                    daysRemaining < 0
                      ? 'text-red-400'
                      : daysRemaining <= 7
                      ? 'text-yellow-400'
                      : 'text-slate-400'
                  }
                >
                  {daysRemaining < 0
                    ? `${Math.abs(daysRemaining)} days overdue`
                    : daysRemaining === 0
                    ? 'Due today'
                    : `${daysRemaining} days left`}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {goals.length === 0 && (
        <div className="text-center text-slate-400 py-8">No learning goals found</div>
      )}
    </div>
  )
}
