'use client'

import { useState, useEffect } from 'react'

interface CompensationAnalytics {
  currentSalary: number
  totalEquityValue: number
  unvestedEquityValue: number
  yearBonuses: number
  totalCompensation: number
  equityGrants: number
}

export function CompensationDashboard() {
  const [analytics, setAnalytics] = useState<CompensationAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/compensation/analytics')
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return <div className="text-slate-400">Loading compensation data...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Compensation Overview</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-sm text-slate-400 mb-1">Base Salary</div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(analytics?.currentSalary || 0)}
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-sm text-slate-400 mb-1">Year Bonuses</div>
          <div className="text-2xl font-bold text-green-400">
            {formatCurrency(analytics?.yearBonuses || 0)}
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-sm text-slate-400 mb-1">Vested Equity</div>
          <div className="text-2xl font-bold text-blue-400">
            {formatCurrency(analytics?.totalEquityValue || 0)}
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-sm text-slate-400 mb-1">Unvested Equity</div>
          <div className="text-2xl font-bold text-purple-400">
            {formatCurrency(analytics?.unvestedEquityValue || 0)}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <div className="text-sm text-slate-400 mb-2">Total Compensation</div>
        <div className="text-4xl font-bold text-white">
          {formatCurrency(analytics?.totalCompensation || 0)}
        </div>
        <div className="text-sm text-slate-500 mt-2">
          Including {analytics?.equityGrants || 0} equity grants
        </div>
      </div>
    </div>
  )
}
