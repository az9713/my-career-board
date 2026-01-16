'use client'

import { useState } from 'react'

interface DecisionFormProps {
  onSuccess: () => void
  initialData?: {
    title?: string
    description?: string
    category?: string
    context?: string
    options?: string[]
    prediction?: string
    confidence?: number
  }
}

const CATEGORIES = [
  { value: '', label: 'Select category' },
  { value: 'role-change', label: 'Role Change' },
  { value: 'compensation', label: 'Compensation' },
  { value: 'project', label: 'Project' },
  { value: 'skill-development', label: 'Skill Development' },
  { value: 'networking', label: 'Networking' },
  { value: 'other', label: 'Other' },
]

export function DecisionForm({ onSuccess, initialData }: DecisionFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [category, setCategory] = useState(initialData?.category || '')
  const [context, setContext] = useState(initialData?.context || '')
  const [options, setOptions] = useState<string[]>(initialData?.options || [])
  const [prediction, setPrediction] = useState(initialData?.prediction || '')
  const [confidence, setConfidence] = useState(initialData?.confidence || 3)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAddOption = () => {
    setOptions([...options, ''])
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
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
      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          category: category || undefined,
          context: context.trim() || undefined,
          options: options.filter((o) => o.trim()),
          prediction: prediction.trim() || undefined,
          confidence,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to save decision')
      }

      setTitle('')
      setDescription('')
      setCategory('')
      setContext('')
      setOptions([])
      setPrediction('')
      setConfidence(3)
      onSuccess()
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-900/50 text-red-200 p-3 rounded-lg text-sm">
          {error}
        </div>
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
          placeholder="What decision are you facing?"
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
          placeholder="Describe the decision in detail..."
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-1">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="context" className="block text-sm font-medium text-slate-300 mb-1">
          Context
        </label>
        <textarea
          id="context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white min-h-[60px]"
          placeholder="What circumstances led to this decision?"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-300">Options</label>
          <button
            type="button"
            onClick={handleAddOption}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Add Option
          </button>
        </div>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                placeholder={`Option ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => handleRemoveOption(index)}
                className="text-red-400 hover:text-red-300 px-2"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="prediction" className="block text-sm font-medium text-slate-300 mb-1">
          Prediction
        </label>
        <textarea
          id="prediction"
          value={prediction}
          onChange={(e) => setPrediction(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white min-h-[60px]"
          placeholder="What do you predict will happen?"
        />
      </div>

      <div>
        <label htmlFor="confidence" className="block text-sm font-medium text-slate-300 mb-1">
          Confidence Level: {confidence}/5
        </label>
        <input
          id="confidence"
          type="range"
          min="1"
          max="5"
          value={confidence}
          onChange={(e) => setConfidence(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        {loading ? 'Saving...' : 'Save Decision'}
      </button>
    </form>
  )
}
