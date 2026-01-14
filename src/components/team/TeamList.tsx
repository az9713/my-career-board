'use client'

import { useState, useEffect } from 'react'

interface TeamMembership {
  id: string
  role: string
  team: {
    id: string
    name: string
    description?: string
  }
}

export function TeamList() {
  const [teams, setTeams] = useState<TeamMembership[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTeams() {
      try {
        const response = await fetch('/api/teams')
        if (response.ok) {
          const data = await response.json()
          setTeams(data.teams)
        }
      } catch (error) {
        console.error('Failed to fetch teams:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeams()
  }, [])

  if (loading) {
    return (
      <div data-testid="teams-loading" className="space-y-3">
        <div className="h-20 bg-slate-700 rounded-lg animate-pulse" />
        <div className="h-20 bg-slate-700 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">No teams yet.</p>
        <p className="text-sm text-slate-500 mt-1">
          Create a team or accept an invite to get started.
        </p>
      </div>
    )
  }

  const roleColors: Record<string, string> = {
    owner: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    admin: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    member: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  }

  return (
    <div className="space-y-3">
      {teams.map((membership) => (
        <div
          key={membership.id}
          className="bg-slate-800 rounded-lg border border-slate-700 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">{membership.team.name}</h4>
              {membership.team.description && (
                <p className="text-sm text-slate-400 mt-1">
                  {membership.team.description}
                </p>
              )}
            </div>
            <span
              className={`text-xs px-2 py-1 rounded border capitalize ${
                roleColors[membership.role] || roleColors.member
              }`}
            >
              {membership.role}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
