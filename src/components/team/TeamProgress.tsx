'use client'

import { useState, useEffect } from 'react'

interface MemberProgress {
  userId: string
  name: string
  betsHit: number
  betsTotal: number
  accuracy?: number
  streak?: number
}

interface TeamProgressProps {
  teamId: string
}

export function TeamProgress({ teamId }: TeamProgressProps) {
  const [members, setMembers] = useState<MemberProgress[]>([])
  const [teamStats, setTeamStats] = useState({ avgAccuracy: 0, totalBets: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProgress() {
      try {
        const response = await fetch(`/api/teams/${teamId}/progress`)
        if (response.ok) {
          const data = await response.json()
          setMembers(data.members || [])
          setTeamStats(data.teamStats || { avgAccuracy: 0, totalBets: 0 })
        }
      } catch (error) {
        console.error('Failed to fetch progress:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [teamId])

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-20 bg-slate-700 rounded-lg animate-pulse" />
        <div className="h-20 bg-slate-700 rounded-lg animate-pulse" />
      </div>
    )
  }

  // Sort by accuracy for leaderboard
  const sortedMembers = [...members].sort((a, b) => {
    const accA = a.betsTotal > 0 ? a.betsHit / a.betsTotal : 0
    const accB = b.betsTotal > 0 ? b.betsHit / b.betsTotal : 0
    return accB - accA
  })

  const getRankLabel = (index: number) => {
    if (index === 0) return '🥇 1st'
    if (index === 1) return '🥈 2nd'
    if (index === 2) return '🥉 3rd'
    return `${index + 1}th`
  }

  return (
    <div className="space-y-6">
      {/* Team Stats */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <h4 className="text-white font-medium mb-3">Team Performance</h4>
        <div className="flex gap-6">
          <div>
            <p className="text-2xl font-bold text-white">
              {Math.round(teamStats.avgAccuracy * 100)}%
            </p>
            <p className="text-sm text-slate-400">Avg Accuracy</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{teamStats.totalBets}</p>
            <p className="text-sm text-slate-400">Total Bets</p>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <h4 className="text-white font-medium mb-3">Leaderboard</h4>
        <div className="space-y-2">
          {sortedMembers.map((member, index) => {
            const accuracy = member.betsTotal > 0
              ? Math.round((member.betsHit / member.betsTotal) * 100)
              : 0

            return (
              <div
                key={member.userId}
                className="flex items-center justify-between py-3 px-4 bg-slate-800 rounded-lg border border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-400 w-12">
                    {getRankLabel(index)}
                  </span>
                  <div>
                    <p className="text-white font-medium">{member.name}</p>
                    <p className="text-sm text-slate-400">
                      {member.betsHit}/{member.betsTotal} bets hit
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {member.streak && member.streak > 0 && (
                    <span className="text-sm text-amber-400">
                      🔥 {member.streak} week streak
                    </span>
                  )}
                  <span className="text-lg font-bold text-white">{accuracy}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
