'use client'

import { useState, useEffect } from 'react'

interface Invite {
  id: string
  team: { name: string }
  invitedBy: { name?: string }
}

export function TeamInvites() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInvites = async () => {
    try {
      const response = await fetch('/api/teams/invites')
      if (response.ok) {
        const data = await response.json()
        setInvites(data.invites)
      }
    } catch (error) {
      console.error('Failed to fetch invites:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvites()
  }, [])

  const handleRespond = async (inviteId: string, action: 'accept' | 'decline') => {
    try {
      const response = await fetch('/api/teams/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId, action }),
      })

      if (response.ok) {
        setInvites((prev) => prev.filter((i) => i.id !== inviteId))
      }
    } catch (error) {
      console.error('Failed to respond to invite:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-16 bg-slate-700 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (invites.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-slate-400">No pending invites.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {invites.map((invite) => (
        <div
          key={invite.id}
          className="bg-slate-800 rounded-lg border border-slate-700 p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-white font-medium">{invite.team.name}</p>
              <p className="text-sm text-slate-400">
                Invited by {invite.invitedBy?.name || 'Unknown'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleRespond(invite.id, 'accept')}
                className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => handleRespond(invite.id, 'decline')}
                className="px-3 py-1.5 text-sm bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
