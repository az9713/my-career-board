'use client'

import { useState, useEffect } from 'react'

interface Member {
  userId: string
  role: string
  user: {
    name?: string
    email: string
  }
}

interface TeamMembersProps {
  teamId: string
  isOwner?: boolean
}

export function TeamMembers({ teamId, isOwner = false }: TeamMembersProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [showInviteForm, setShowInviteForm] = useState(false)

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data.team.members || [])
      }
    } catch (error) {
      console.error('Failed to fetch members:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [teamId])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    try {
      const response = await fetch(`/api/teams/${teamId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })

      if (response.ok) {
        setInviteEmail('')
        setShowInviteForm(false)
      }
    } catch (error) {
      console.error('Failed to send invite:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-12 bg-slate-700 rounded-lg animate-pulse" />
        <div className="h-12 bg-slate-700 rounded-lg animate-pulse" />
      </div>
    )
  }

  const roleColors: Record<string, string> = {
    owner: 'text-amber-400',
    admin: 'text-blue-400',
    member: 'text-slate-400',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-white font-medium">Members ({members.length})</h4>
        {isOwner && (
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Invite
          </button>
        )}
      </div>

      {showInviteForm && (
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@example.com"
            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg"
          >
            Send
          </button>
        </form>
      )}

      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.userId}
            className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-lg"
          >
            <div>
              <p className="text-white">{member.user.name || member.user.email}</p>
              <p className="text-xs text-slate-500">{member.user.email}</p>
            </div>
            <span className={`text-xs capitalize ${roleColors[member.role]}`}>
              {member.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
