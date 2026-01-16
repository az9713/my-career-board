'use client'

interface Checkin {
  id: string
  response: string
  mood: number | null
  createdAt: string
  prompt: {
    question: string
  }
}

interface CheckinHistoryProps {
  checkins: Checkin[]
}

const moodEmojis: Record<number, string> = {
  1: '😞',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
}

export function CheckinHistory({ checkins }: CheckinHistoryProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (checkins.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-lg">No check-ins yet</p>
        <p className="text-sm mt-2">Complete your first check-in to start tracking!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {checkins.map((checkin) => (
        <div
          key={checkin.id}
          className="bg-slate-800 rounded-lg border border-slate-700 p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs text-slate-500">
              {formatDate(checkin.createdAt)}
            </span>
            {checkin.mood && (
              <span
                data-testid="mood-indicator"
                className="text-xl"
                title={`Mood: ${checkin.mood}/5`}
              >
                {moodEmojis[checkin.mood]}
              </span>
            )}
          </div>

          <p className="text-slate-300">{checkin.response}</p>

          <div className="mt-2 text-xs text-slate-500">
            Q: {checkin.prompt.question}
          </div>
        </div>
      ))}
    </div>
  )
}
