'use client'

import { useState } from 'react'

interface SkillFormProps {
  onSuccess: () => void
  initialData?: {
    name?: string
    category?: string
    proficiency?: number
    targetLevel?: number
    yearsExperience?: number
  }
}

const CATEGORIES = [
  { value: 'technical', label: 'Technical' },
  { value: 'soft-skill', label: 'Soft Skill' },
  { value: 'domain', label: 'Domain Knowledge' },
  { value: 'tool', label: 'Tool/Framework' },
]

export function SkillForm({ onSuccess, initialData }: SkillFormProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [category, setCategory] = useState(initialData?.category || '')
  const [proficiency, setProficiency] = useState(initialData?.proficiency || 3)
  const [targetLevel, setTargetLevel] = useState(initialData?.targetLevel || 5)
  const [yearsExperience, setYearsExperience] = useState(initialData?.yearsExperience?.toString() || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    if (!category) {
      setError('Category is required')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          proficiency,
          targetLevel,
          yearsExperience: yearsExperience ? parseFloat(yearsExperience) : undefined,
        }),
      })

      if (!res.ok) throw new Error('Failed to save')

      setName('')
      setCategory('')
      setProficiency(3)
      setTargetLevel(5)
      setYearsExperience('')
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
        <div className="bg-red-900/50 text-red-200 p-3 rounded-lg text-sm">{error}</div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
          placeholder="e.g., TypeScript, Leadership"
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
          <option value="">Select category</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Proficiency: {proficiency}/5
        </label>
        <input
          type="range"
          min="1"
          max="5"
          value={proficiency}
          onChange={(e) => setProficiency(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Target Level: {targetLevel}/5
        </label>
        <input
          type="range"
          min="1"
          max="5"
          value={targetLevel}
          onChange={(e) => setTargetLevel(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="yearsExperience" className="block text-sm font-medium text-slate-300 mb-1">
          Years of Experience
        </label>
        <input
          id="yearsExperience"
          type="number"
          step="0.5"
          min="0"
          value={yearsExperience}
          onChange={(e) => setYearsExperience(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
          placeholder="e.g., 3.5"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg"
      >
        {loading ? 'Saving...' : 'Save Skill'}
      </button>
    </form>
  )
}
