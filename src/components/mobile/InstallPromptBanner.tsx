'use client'

interface InstallPromptBannerProps {
  canInstall: boolean
  onInstall: () => void
  onDismiss?: () => void
}

export function InstallPromptBanner({
  canInstall,
  onInstall,
  onDismiss,
}: InstallPromptBannerProps) {
  if (!canInstall) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-slate-800 rounded-lg border border-slate-700 p-4 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </div>

        <div className="flex-1">
          <h4 className="text-white font-medium">Install App</h4>
          <p className="text-sm text-slate-400 mt-1">
            Get faster access and a better experience
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={onInstall}
          aria-label="Install"
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Install
        </button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
          >
            Not now
          </button>
        )}
      </div>
    </div>
  )
}
