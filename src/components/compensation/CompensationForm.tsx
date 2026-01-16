'use client'

import { useState } from 'react'

interface CompensationFormProps {
  record?: any
  onSuccess: () => void
  onCancel?: () => void
}

export function CompensationForm({ record, onSuccess, onCancel }: CompensationFormProps) {
  const [type, setType] = useState(record?.type || 'salary')
  const [amount, setAmount] = useState(record?.amount?.toString() || '')
  const [currency, setCurrency] = useState(record?.currency || 'USD')
  const [company, setCompany] = useState(record?.company || '')
  const [role, setRole] = useState(record?.role || '')
  const [effectiveDate, setEffectiveDate] = useState(
    record?.effectiveDate?.split('T')[0] || ''
  )
  const [notes, setNotes] = useState(record?.notes || '')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!type || !amount || !company || !role || !effectiveDate) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const url = record
        ? `/api/compensation/records/${record.id}`
        : '/api/compensation/records'
      const response = await fetch(url, {
        method: record ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount: parseFloat(amount),
          currency,
          company,
          role,
          effectiveDate,
          notes,
        }),
      })

      if (response.ok) {
        onSuccess()
      } else {
        setError('Failed to save compensation record')
      }
    } catch (err) {
      setError('Failed to save compensation record')
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
        <label htmlFor="type" className="block text-sm font-medium text-slate-300 mb-1">
          Type
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        >
          <option value="salary">Salary</option>
          <option value="bonus">Bonus</option>
          <option value="commission">Commission</option>
          <option value="signing">Signing Bonus</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-1">
            Amount
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="150000"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          />
        </div>
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-slate-300 mb-1">
            Currency
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-medium text-slate-300 mb-1">
          Company
        </label>
        <input
          type="text"
          id="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Tech Corp"
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-1">
          Role
        </label>
        <input
          type="text"
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Senior Engineer"
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        />
      </div>

      <div>
        <label htmlFor="effectiveDate" className="block text-sm font-medium text-slate-300 mb-1">
          Effective Date
        </label>
        <input
          type="date"
          id="effectiveDate"
          value={effectiveDate}
          onChange={(e) => setEffectiveDate(e.target.value)}
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
