'use client'

import { useState } from 'react'

interface Question {
  id: string
  question: string
  category: string
  type: string
}

interface FeedbackResponseFormProps {
  questions: Question[]
  token: string
  onSuccess: () => void
}

export function FeedbackResponseForm({ questions, token, onSuccess }: FeedbackResponseFormProps) {
  const [answers, setAnswers] = useState<Record<string, { scaleValue?: number; textValue?: string }>>({})
  const [relationship, setRelationship] = useState('peer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleScaleChange = (questionId: string, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], scaleValue: value },
    }))
  }

  const handleTextChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], textValue: value },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        ...answer,
      }))

      const res = await fetch('/api/feedback/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          relationship,
          answers: formattedAnswers,
        }),
      })

      if (!res.ok) throw new Error('Failed to submit')

      onSuccess()
    } catch (err) {
      setError('Failed to submit feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-900/50 text-red-200 p-3 rounded-lg text-sm">{error}</div>
      )}

      <div>
        <label htmlFor="relationship" className="block text-sm font-medium text-slate-300 mb-1">
          Your relationship to this person
        </label>
        <select
          id="relationship"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="peer">Peer</option>
          <option value="manager">Manager</option>
          <option value="direct-report">Direct Report</option>
          <option value="cross-functional">Cross-functional</option>
        </select>
      </div>

      {questions.map((question) => (
        <div key={question.id} className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-white mb-3">{question.question}</div>

          {question.type === 'scale' && (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleScaleChange(question.id, value)}
                  className={`flex-1 py-2 rounded-lg border transition-colors ${
                    answers[question.id]?.scaleValue === value
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          )}

          {question.type === 'text' && (
            <textarea
              value={answers[question.id]?.textValue || ''}
              onChange={(e) => handleTextChange(question.id, e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white min-h-[80px]"
              placeholder="Your response..."
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg"
      >
        {loading ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  )
}
