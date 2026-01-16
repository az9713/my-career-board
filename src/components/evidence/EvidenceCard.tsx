'use client'

interface Evidence {
  id: string
  title: string
  type: string
  description?: string
  date: string
  source?: string
  impact?: string
}

interface EvidenceCardProps {
  evidence: Evidence
  onEdit?: (evidence: Evidence) => void
  onDelete?: (id: string) => void
}

const typeColors: Record<string, string> = {
  win: 'bg-green-600',
  feedback: 'bg-blue-600',
  metric: 'bg-purple-600',
  artifact: 'bg-orange-600',
  milestone: 'bg-yellow-600',
}

export function EvidenceCard({ evidence, onEdit, onDelete }: EvidenceCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium text-white ${
                typeColors[evidence.type] || 'bg-slate-600'
              }`}
            >
              {evidence.type}
            </span>
            {evidence.source && (
              <span className="text-xs text-slate-400">
                from {evidence.source}
              </span>
            )}
          </div>

          <h3 className="text-lg font-medium text-white mb-1">
            {evidence.title}
          </h3>

          {evidence.description && (
            <p className="text-slate-300 text-sm mb-2">
              {evidence.description}
            </p>
          )}

          {evidence.impact && (
            <p className="text-slate-400 text-sm">
              <span className="font-medium">Impact:</span> {evidence.impact}
            </p>
          )}

          <p className="text-slate-500 text-xs mt-2">
            {formatDate(evidence.date)}
          </p>
        </div>

        <div className="flex gap-2 ml-4">
          {onEdit && (
            <button
              onClick={() => onEdit(evidence)}
              className="text-slate-400 hover:text-white p-1"
              aria-label="Edit"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(evidence.id)}
              className="text-slate-400 hover:text-red-400 p-1"
              aria-label="Delete"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
