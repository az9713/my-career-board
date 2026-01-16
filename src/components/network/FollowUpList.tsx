'use client'

interface FollowUp {
  id: string
  name: string
  nextFollowUp: string
  relationship?: string
  company?: string
}

interface FollowUpListProps {
  followUps: FollowUp[]
  onContactClick?: (followUp: FollowUp) => void
}

export function FollowUpList({ followUps, onContactClick }: FollowUpListProps) {
  if (followUps.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p>No follow-ups scheduled</p>
        <p className="text-sm mt-2">Set follow-up dates on your contacts</p>
      </div>
    )
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="space-y-2">
      {followUps.map((followUp) => {
        const followUpDate = new Date(followUp.nextFollowUp)
        const isOverdue = followUpDate < today
        const isToday = followUpDate.toDateString() === today.toDateString()

        return (
          <button
            key={followUp.id}
            onClick={() => onContactClick?.(followUp)}
            className={`w-full bg-slate-800 hover:bg-slate-700 rounded-lg p-3 text-left flex items-center justify-between ${
              isOverdue ? 'border-l-4 border-red-500' : isToday ? 'border-l-4 border-yellow-500' : ''
            }`}
          >
            <div>
              <div className="text-white font-medium">{followUp.name}</div>
              {followUp.company && (
                <div className="text-slate-400 text-sm">{followUp.company}</div>
              )}
            </div>
            <div className="text-right">
              <div className={`text-sm font-medium ${
                isOverdue ? 'text-red-400' : isToday ? 'text-yellow-400' : 'text-slate-300'
              }`}>
                {isOverdue ? 'Overdue' : isToday ? 'Today' : followUpDate.toLocaleDateString()}
              </div>
              {followUp.relationship && (
                <div className="text-xs text-slate-500 capitalize">{followUp.relationship}</div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
