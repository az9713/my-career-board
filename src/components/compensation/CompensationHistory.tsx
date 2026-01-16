'use client'

import { useState, useEffect } from 'react'

interface CompensationRecord {
  id: string
  type: string
  amount: number
  currency: string
  effectiveDate: string
  company: string
  role: string
  notes?: string
}

const typeColors: Record<string, string> = {
  salary: 'bg-blue-500/20 text-blue-300',
  bonus: 'bg-green-500/20 text-green-300',
  commission: 'bg-yellow-500/20 text-yellow-300',
  signing: 'bg-purple-500/20 text-purple-300',
  other: 'bg-slate-500/20 text-slate-300',
}

export function CompensationHistory() {
  const [records, setRecords] = useState<CompensationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    async function fetchRecords() {
      try {
        const url = filter
          ? `/api/compensation/records?type=${filter}`
          : '/api/compensation/records'
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setRecords(data)
        }
      } catch (error) {
        console.error('Failed to fetch records:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRecords()
  }, [filter])

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return <div className="text-slate-400">Loading compensation history...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Compensation History</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
        >
          <option value="">All Types</option>
          <option value="salary">Salary</option>
          <option value="bonus">Bonus</option>
          <option value="commission">Commission</option>
          <option value="signing">Signing Bonus</option>
        </select>
      </div>

      <div className="space-y-2">
        {records.map((record) => (
          <div
            key={record.id}
            className="bg-slate-800 rounded-lg border border-slate-700 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                    typeColors[record.type] || typeColors.other
                  }`}
                >
                  {record.type}
                </span>
                <div>
                  <div className="text-white font-medium">
                    {formatCurrency(record.amount, record.currency)}
                  </div>
                  <div className="text-sm text-slate-400">
                    {record.company} · {record.role}
                  </div>
                </div>
              </div>
              <div className="text-sm text-slate-500">
                {formatDate(record.effectiveDate)}
              </div>
            </div>
            {record.notes && (
              <div className="mt-2 text-sm text-slate-400">{record.notes}</div>
            )}
          </div>
        ))}
      </div>

      {records.length === 0 && (
        <div className="text-center text-slate-400 py-8">
          No compensation records found
        </div>
      )}
    </div>
  )
}
