'use client'

interface CheckinReminderProps {
  onStart?: () => void
  onDismiss?: () => void
}

export function CheckinReminder({ onStart, onDismiss }: CheckinReminderProps) {
  return (
    <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✨</span>
          <div>
            <p className="text-white font-medium">Time for your daily check-in!</p>
            <p className="text-sm text-slate-400">
              Take a moment to reflect on your day
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              Dismiss
            </button>
          )}
          {onStart && (
            <button
              onClick={onStart}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Check in now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
