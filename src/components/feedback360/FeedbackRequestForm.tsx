'use client'

import { useState } from 'react'

interface FeedbackRequestFormProps {
  onSuccess: () => void
}

export function FeedbackRequestForm({ onSuccess }: FeedbackRequestFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [anonymous, setAnonymous] = useState(true)
  const [questions, setQuestions] = useState<Array<{ question: string; category: string; type: string }>>([])
  const [recipients, setRecipients] = useState<Array<{ email: string; name: string; relationship: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: '', category: 'general', type: 'scale' }])
  }

  const handleAddRecipient = () => {
    setRecipients([...recipients, { email: '', name: '', relationship: 'peer' }])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          anonymous,
          questions: questions.filter(q => q.question.trim()),
          recipients: recipients.filter(r => r.email.trim()),
        }),
      })

      if (!res.ok) throw new Error('Failed to create request')

      onSuccess()
    } catch (err) {
      setError('Failed to create request. Please try again.')
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
        <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
          placeholder="e.g., Q1 2024 Feedback"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white min-h-[80px]"
          placeholder="Context for your feedback request..."
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="anonymous"
          type="checkbox"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="anonymous" className="text-sm text-slate-300">
          Anonymous responses
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">Questions</span>
          <button
            type="button"
            onClick={handleAddQuestion}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Add Question
          </button>
        </div>
        {questions.map((q, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              type="text"
              value={q.question}
              onChange={(e) => {
                const newQ = [...questions]
                newQ[i].question = e.target.value
                setQuestions(newQ)
              }}
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              placeholder="Question"
            />
            <select
              value={q.category}
              onChange={(e) => {
                const newQ = [...questions]
                newQ[i].category = e.target.value
                setQuestions(newQ)
              }}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="leadership">Leadership</option>
              <option value="communication">Communication</option>
              <option value="technical">Technical</option>
              <option value="collaboration">Collaboration</option>
              <option value="general">General</option>
            </select>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">Recipients</span>
          <button
            type="button"
            onClick={handleAddRecipient}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Add Recipient
          </button>
        </div>
        {recipients.map((r, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              type="email"
              value={r.email}
              onChange={(e) => {
                const newR = [...recipients]
                newR[i].email = e.target.value
                setRecipients(newR)
              }}
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              placeholder="Email"
            />
            <select
              value={r.relationship}
              onChange={(e) => {
                const newR = [...recipients]
                newR[i].relationship = e.target.value
                setRecipients(newR)
              }}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="peer">Peer</option>
              <option value="manager">Manager</option>
              <option value="direct-report">Direct Report</option>
              <option value="cross-functional">Cross-functional</option>
            </select>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg"
      >
        {loading ? 'Creating...' : 'Create Request'}
      </button>
    </form>
  )
}
