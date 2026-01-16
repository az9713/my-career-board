'use client'

import { useState } from 'react'

interface ContactFormProps {
  contact?: any
  onSuccess: () => void
  onCancel?: () => void
}

export function ContactForm({ contact, onSuccess, onCancel }: ContactFormProps) {
  const [name, setName] = useState(contact?.name || '')
  const [email, setEmail] = useState(contact?.email || '')
  const [company, setCompany] = useState(contact?.company || '')
  const [title, setTitle] = useState(contact?.title || '')
  const [relationship, setRelationship] = useState(contact?.relationship || 'peer')
  const [strength, setStrength] = useState(contact?.strength || 3)
  const [notes, setNotes] = useState(contact?.notes || '')
  const [linkedinUrl, setLinkedinUrl] = useState(contact?.linkedinUrl || '')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setIsSubmitting(true)

    try {
      const url = contact ? `/api/network/contacts/${contact.id}` : '/api/network/contacts'
      const response = await fetch(url, {
        method: contact ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email || undefined,
          company: company || undefined,
          title: title || undefined,
          relationship,
          strength,
          notes: notes || undefined,
          linkedinUrl: linkedinUrl || undefined,
        }),
      })

      if (response.ok) {
        onSuccess()
      }
    } catch (err) {
      setError('Failed to save contact')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded">{error}</div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-slate-300 mb-1">
            Company
          </label>
          <input
            type="text"
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="relationship" className="block text-sm font-medium text-slate-300 mb-1">
          Relationship
        </label>
        <select
          id="relationship"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="mentor">Mentor</option>
          <option value="mentee">Mentee</option>
          <option value="peer">Peer</option>
          <option value="sponsor">Sponsor</option>
          <option value="colleague">Colleague</option>
          <option value="recruiter">Recruiter</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Relationship Strength: {strength}/5
        </label>
        <input
          type="range"
          min="1"
          max="5"
          value={strength}
          onChange={(e) => setStrength(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="linkedinUrl" className="block text-sm font-medium text-slate-300 mb-1">
          LinkedIn URL
        </label>
        <input
          type="url"
          id="linkedinUrl"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Contact'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
