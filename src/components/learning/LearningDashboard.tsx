'use client'

import { useState, useEffect } from 'react'

interface LearningAnalytics {
  totalResources: number
  completedResources: number
  inProgressResources: number
  totalHoursSpent: number
  activeCertifications: number
  expiredCertifications: number
  activeGoals: number
  completedGoals: number
  averageGoalProgress: number
}

export function LearningDashboard() {
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/learning/analytics')
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return <div className="text-slate-400">Loading learning data...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Learning Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-sm text-slate-400 mb-1">Resources</div>
          <div className="text-2xl font-bold text-white">
            {analytics?.totalResources || 0}
          </div>
          <div className="text-xs text-green-400 mt-1">
            {analytics?.completedResources || 0} completed
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-sm text-slate-400 mb-1">Hours Spent</div>
          <div className="text-2xl font-bold text-blue-400">
            {analytics?.totalHoursSpent || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Total learning time</div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-sm text-slate-400 mb-1">Certifications</div>
          <div className="text-2xl font-bold text-green-400">
            {analytics?.activeCertifications || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {analytics?.expiredCertifications || 0} expired
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-sm text-slate-400 mb-1">Active Goals</div>
          <div className="text-2xl font-bold text-purple-400">
            {analytics?.activeGoals || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {analytics?.averageGoalProgress || 0}% avg progress
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <h3 className="text-lg font-medium text-white mb-3">Resource Progress</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Completed</span>
              <span className="text-green-400">{analytics?.completedResources || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">In Progress</span>
              <span className="text-blue-400">{analytics?.inProgressResources || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Not Started</span>
              <span className="text-slate-400">
                {(analytics?.totalResources || 0) -
                 (analytics?.completedResources || 0) -
                 (analytics?.inProgressResources || 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <h3 className="text-lg font-medium text-white mb-3">Goals Progress</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Active</span>
              <span className="text-purple-400">{analytics?.activeGoals || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Completed</span>
              <span className="text-green-400">{analytics?.completedGoals || 0}</span>
            </div>
            <div className="mt-3">
              <div className="text-xs text-slate-400 mb-1">Average Progress</div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${analytics?.averageGoalProgress || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
