'use client'

import { useState } from 'react'

interface CertificationFormProps {
  certification?: any
  onSuccess: () => void
  onCancel?: () => void
}

export function CertificationForm({ certification, onSuccess, onCancel }: CertificationFormProps) {
  const [name, setName] = useState(certification?.name || '')
  const [issuer, setIssuer] = useState(certification?.issuer || '')
  const [credentialId, setCredentialId] = useState(certification?.credentialId || '')
  const [credentialUrl, setCredentialUrl] = useState(certification?.credentialUrl || '')
  const [earnedAt, setEarnedAt] = useState(certification?.earnedAt?.split('T')[0] || '')
  const [expiresAt, setExpiresAt] = useState(certification?.expiresAt?.split('T')[0] || '')
  const [notes, setNotes] = useState(certification?.notes || '')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !issuer.trim() || !earnedAt) {
      setError('Name, issuer, and earned date are required')
      return
    }

    setIsSubmitting(true)

    try {
      const url = certification
        ? `/api/learning/certifications/${certification.id}`
        : '/api/learning/certifications'
      const response = await fetch(url, {
        method: certification ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          issuer,
          credentialId,
          credentialUrl,
          earnedAt,
          expiresAt: expiresAt || undefined,
          notes,
        }),
      })

      if (response.ok) {
        onSuccess()
      } else {
        setError('Failed to save certification')
      }
    } catch (err) {
      setError('Failed to save certification')
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
          placeholder="e.g., AWS Solutions Architect"
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        />
      </div>

      <div>
        <label htmlFor="issuer" className="block text-sm font-medium text-slate-300 mb-1">
          Issuer
        </label>
        <input
          type="text"
          id="issuer"
          value={issuer}
          onChange={(e) => setIssuer(e.target.value)}
          placeholder="e.g., Amazon Web Services"
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="earnedAt" className="block text-sm font-medium text-slate-300 mb-1">
            Earned Date
          </label>
          <input
            type="date"
            id="earnedAt"
            value={earnedAt}
            onChange={(e) => setEarnedAt(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          />
        </div>
        <div>
          <label htmlFor="expiresAt" className="block text-sm font-medium text-slate-300 mb-1">
            Expires (Optional)
          </label>
          <input
            type="date"
            id="expiresAt"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          />
        </div>
      </div>

      <div>
        <label htmlFor="credentialId" className="block text-sm font-medium text-slate-300 mb-1">
          Credential ID (Optional)
        </label>
        <input
          type="text"
          id="credentialId"
          value={credentialId}
          onChange={(e) => setCredentialId(e.target.value)}
          placeholder="e.g., ABC123XYZ"
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        />
      </div>

      <div>
        <label htmlFor="credentialUrl" className="block text-sm font-medium text-slate-300 mb-1">
          Credential URL (Optional)
        </label>
        <input
          type="url"
          id="credentialUrl"
          value={credentialUrl}
          onChange={(e) => setCredentialUrl(e.target.value)}
          placeholder="https://"
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
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
