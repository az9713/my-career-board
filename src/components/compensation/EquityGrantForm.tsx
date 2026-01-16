'use client'

import { useState } from 'react'

interface EquityGrantFormProps {
  grant?: any
  onSuccess: () => void
  onCancel?: () => void
}

export function EquityGrantForm({ grant, onSuccess, onCancel }: EquityGrantFormProps) {
  const [company, setCompany] = useState(grant?.company || '')
  const [grantType, setGrantType] = useState(grant?.grantType || 'rsu')
  const [totalShares, setTotalShares] = useState(grant?.totalShares?.toString() || '')
  const [grantDate, setGrantDate] = useState(grant?.grantDate?.split('T')[0] || '')
  const [strikePrice, setStrikePrice] = useState(grant?.strikePrice?.toString() || '')
  const [currentPrice, setCurrentPrice] = useState(grant?.currentPrice?.toString() || '')
  const [cliffMonths, setCliffMonths] = useState(grant?.cliffMonths?.toString() || '12')
  const [vestingMonths, setVestingMonths] = useState(grant?.vestingMonths?.toString() || '48')
  const [notes, setNotes] = useState(grant?.notes || '')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!company || !grantType || !totalShares || !grantDate) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const url = grant
        ? `/api/compensation/equity/${grant.id}`
        : '/api/compensation/equity'
      const response = await fetch(url, {
        method: grant ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company,
          grantType,
          totalShares: parseInt(totalShares),
          grantDate,
          strikePrice: strikePrice ? parseFloat(strikePrice) : undefined,
          currentPrice: currentPrice ? parseFloat(currentPrice) : undefined,
          cliffMonths: parseInt(cliffMonths),
          vestingMonths: parseInt(vestingMonths),
          notes,
        }),
      })

      if (response.ok) {
        onSuccess()
      } else {
        setError('Failed to save equity grant')
      }
    } catch (err) {
      setError('Failed to save equity grant')
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="grantType" className="block text-sm font-medium text-slate-300 mb-1">
            Grant Type
          </label>
          <select
            id="grantType"
            value={grantType}
            onChange={(e) => setGrantType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          >
            <option value="rsu">RSU</option>
            <option value="iso">ISO</option>
            <option value="nso">NSO</option>
            <option value="options">Options</option>
          </select>
        </div>
        <div>
          <label htmlFor="totalShares" className="block text-sm font-medium text-slate-300 mb-1">
            Total Shares
          </label>
          <input
            type="number"
            id="totalShares"
            value={totalShares}
            onChange={(e) => setTotalShares(e.target.value)}
            placeholder="1000"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          />
        </div>
      </div>

      <div>
        <label htmlFor="grantDate" className="block text-sm font-medium text-slate-300 mb-1">
          Grant Date
        </label>
        <input
          type="date"
          id="grantDate"
          value={grantDate}
          onChange={(e) => setGrantDate(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="strikePrice" className="block text-sm font-medium text-slate-300 mb-1">
            Strike Price (Optional)
          </label>
          <input
            type="number"
            step="0.01"
            id="strikePrice"
            value={strikePrice}
            onChange={(e) => setStrikePrice(e.target.value)}
            placeholder="10.00"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          />
        </div>
        <div>
          <label htmlFor="currentPrice" className="block text-sm font-medium text-slate-300 mb-1">
            Current Price (Optional)
          </label>
          <input
            type="number"
            step="0.01"
            id="currentPrice"
            value={currentPrice}
            onChange={(e) => setCurrentPrice(e.target.value)}
            placeholder="100.00"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="cliffMonths" className="block text-sm font-medium text-slate-300 mb-1">
            Cliff (Months)
          </label>
          <input
            type="number"
            id="cliffMonths"
            value={cliffMonths}
            onChange={(e) => setCliffMonths(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          />
        </div>
        <div>
          <label htmlFor="vestingMonths" className="block text-sm font-medium text-slate-300 mb-1">
            Vesting Period (Months)
          </label>
          <input
            type="number"
            id="vestingMonths"
            value={vestingMonths}
            onChange={(e) => setVestingMonths(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          />
        </div>
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
