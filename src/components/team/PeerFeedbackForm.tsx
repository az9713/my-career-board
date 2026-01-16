'use client'

import { useState } from 'react'

interface PeerFeedbackFormProps {
  teamId: string
  toUserId: string
  toUserName: string
  onSent?: () => void
}

const feedbackTypes = [
  { id: 'encouragement', label: 'Encouragement', icon: '👏' },
  { id: 'suggestion', label: 'Suggestion', icon: '💡' },
  { id: 'concern', label: 'Concern', icon: '🤔' },
  { id: 'celebration', label: 'Celebration', icon: '🎉' },
]

export function PeerFeedbackForm({
  teamId,
  toUserId,
  toUserName,
  onSent,
}: PeerFeedbackFormProps) {
  const [type, setType] = useState('encouragement')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId,
          type,
          content: content.trim(),
        }),
      })

      if (response.ok) {
        setContent('')
        onSent?.()
      }
    } catch (error) {
      console.error('Failed to send feedback:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <h4 className="text-white font-medium mb-4">Feedback for {toUserName}</h4>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Type</label>
          <div className="flex flex-wrap gap-2">
            {feedbackTypes.map((ft) => (
              <button
                key={ft.id}
                type="button"
                onClick={() => setType(ft.id)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  type === ft.id
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {ft.icon} {ft.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="feedback-message"
            className="block text-sm text-slate-400 mb-1"
          >
            Message
          </label>
          <textarea
            id="feedback-message"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Share your feedback..."
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting ? 'Sending...' : 'Send Feedback'}
        </button>
      </form>
    </div>
  )
}
