'use client'

import { useState, useEffect } from 'react'

interface SyncStatus {
  connected: boolean
  provider: string | null
  lastSync?: string
}

export function CalendarSyncSettings() {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/calendar/sync')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleSync = async () => {
    if (!status?.provider) return

    setSyncing(true)
    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: status.provider }),
      })

      if (response.ok) {
        // Refresh status after sync
        await fetchStatus()
      }
    } catch (error) {
      console.error('Failed to sync calendar:', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleConnect = (provider: string) => {
    // In production, this would redirect to OAuth flow
    window.location.href = `/api/auth/${provider}/calendar`
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-slate-700 rounded-lg" />
      </div>
    )
  }

  const formatLastSync = (lastSync: string) => {
    const date = new Date(lastSync)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">Calendar Sync</h3>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        {status?.connected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">Connected</p>
                  <p className="text-sm text-slate-400 capitalize">
                    {status.provider} Calendar
                  </p>
                </div>
              </div>

              <button
                onClick={handleSync}
                disabled={syncing}
                aria-label="Sync now"
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>

            {status.lastSync && (
              <p className="text-sm text-slate-400">
                Last synced: {formatLastSync(status.lastSync)}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Not Connected</p>
                <p className="text-sm text-slate-400">
                  Connect a calendar to sync your events
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleConnect('google')}
                aria-label="Connect Google Calendar"
                className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Connect Google Calendar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
