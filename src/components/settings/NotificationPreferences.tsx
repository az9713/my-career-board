'use client'

import { useEffect, useState } from 'react'

interface Preferences {
  emailEnabled: boolean
  quarterlyReminders: boolean
  weeklyCheckins: boolean
  avoidanceAlerts: boolean
  streakNotifications: boolean
  notificationEmail?: string
}

const defaultPreferences: Preferences = {
  emailEnabled: true,
  quarterlyReminders: true,
  weeklyCheckins: true,
  avoidanceAlerts: true,
  streakNotifications: true,
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPreferences()
  }, [])

  async function loadPreferences() {
    try {
      const response = await fetch('/api/notifications/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
      }
    } catch (err) {
      console.error('Failed to load preferences:', err)
    } finally {
      setLoading(false)
    }
  }

  async function updatePreference(key: keyof Preferences, value: boolean) {
    setSaving(true)
    setError(null)

    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to save')
        // Revert on failure
        setPreferences(preferences)
      }
    } catch (err) {
      setError('Failed to save preferences')
      setPreferences(preferences)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 text-slate-400">
        Loading preferences...
      </div>
    )
  }

  const toggleOptions = [
    {
      key: 'emailEnabled' as const,
      label: 'Email Notifications',
      description: 'Receive notifications via email',
      isParent: true,
    },
    {
      key: 'quarterlyReminders' as const,
      label: 'Quarterly Review Reminders',
      description: 'Get reminded when quarterly review is due',
      isChild: true,
    },
    {
      key: 'weeklyCheckins' as const,
      label: 'Weekly Check-ins',
      description: 'Short weekly accountability prompts',
      isChild: true,
    },
    {
      key: 'avoidanceAlerts' as const,
      label: 'Avoidance Alerts',
      description: 'Get notified when patterns suggest avoidance',
      isChild: true,
    },
    {
      key: 'streakNotifications' as const,
      label: 'Streak Notifications',
      description: 'Celebrate streak milestones',
      isChild: true,
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">Notification Preferences</h3>

      {error && (
        <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {toggleOptions.map((option) => (
          <div
            key={option.key}
            className={`flex items-center justify-between p-3 rounded-lg ${
              option.isChild ? 'ml-4 bg-slate-800/50' : 'bg-slate-800'
            }`}
          >
            <div>
              <div className="text-white font-medium">{option.label}</div>
              <div className="text-sm text-slate-400">{option.description}</div>
            </div>
            <button
              data-testid={`toggle-${option.key}`}
              onClick={() => updatePreference(option.key, !preferences[option.key])}
              disabled={saving || (option.isChild && !preferences.emailEnabled)}
              className={`
                relative w-12 h-6 rounded-full transition-colors
                ${preferences[option.key] ? 'bg-blue-600' : 'bg-slate-600'}
                ${(option.isChild && !preferences.emailEnabled) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span
                className={`
                  absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
                  ${preferences[option.key] ? 'translate-x-6' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
