'use client'

interface FeedbackRequest {
  id: string
  title: string
  status: string
  createdAt: string
  responses: Array<{ id: string }>
  recipients: Array<{ id: string }>
}

interface FeedbackRequestCardProps {
  request: FeedbackRequest
  onView?: (request: FeedbackRequest) => void
}

export function FeedbackRequestCard({ request, onView }: FeedbackRequestCardProps) {
  const responseCount = request.responses?.length || 0
  const recipientCount = request.recipients?.length || 0
  const responseRate = recipientCount > 0 ? Math.round((responseCount / recipientCount) * 100) : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-500/20 text-green-300'
      case 'closed':
        return 'bg-slate-500/20 text-slate-300'
      default:
        return 'bg-slate-500/20 text-slate-300'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-medium text-white">{request.title}</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
          {request.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Responses</span>
          <span className="text-white">{responseCount}/{recipientCount}</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${responseRate}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{formatDate(request.createdAt)}</span>
        {onView && (
          <button
            onClick={() => onView(request)}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            View Results
          </button>
        )}
      </div>
    </div>
  )
}
