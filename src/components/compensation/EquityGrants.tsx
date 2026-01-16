'use client'

import { useState, useEffect } from 'react'

interface EquityGrant {
  id: string
  company: string
  grantType: string
  grantDate: string
  totalShares: number
  vestedShares: number
  strikePrice?: number
  currentPrice?: number
  status: string
}

const grantTypeLabels: Record<string, string> = {
  rsu: 'RSU',
  iso: 'ISO',
  nso: 'NSO',
  options: 'Options',
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-300',
  exercised: 'bg-blue-500/20 text-blue-300',
  expired: 'bg-red-500/20 text-red-300',
  cancelled: 'bg-slate-500/20 text-slate-300',
}

export function EquityGrants() {
  const [grants, setGrants] = useState<EquityGrant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGrants() {
      try {
        const response = await fetch('/api/compensation/equity')
        if (response.ok) {
          const data = await response.json()
          setGrants(data)
        }
      } catch (error) {
        console.error('Failed to fetch grants:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchGrants()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const calculateValue = (grant: EquityGrant) => {
    if (grant.currentPrice) {
      const value = grant.vestedShares * grant.currentPrice
      return formatCurrency(value)
    }
    return 'N/A'
  }

  const calculateGainPerShare = (grant: EquityGrant) => {
    if (grant.currentPrice && grant.strikePrice) {
      return grant.currentPrice - grant.strikePrice
    }
    return null
  }

  if (loading) {
    return <div className="text-slate-400">Loading equity grants...</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Equity Grants</h2>

      <div className="space-y-4">
        {grants.map((grant) => {
          const vestingProgress = Math.round(
            (grant.vestedShares / grant.totalShares) * 100
          )
          const gainPerShare = calculateGainPerShare(grant)

          return (
            <div
              key={grant.id}
              className="bg-slate-800 rounded-lg border border-slate-700 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-medium text-white">{grant.company}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-slate-400">
                      {grantTypeLabels[grant.grantType] || grant.grantType}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        statusColors[grant.status] || statusColors.active
                      }`}
                    >
                      {grant.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-white">
                    {calculateValue(grant)}
                  </div>
                  <div className="text-sm text-slate-400">Vested Value</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="text-sm text-slate-400">Total Shares</div>
                  <div className="text-white font-medium">
                    {grant.totalShares.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Vested</div>
                  <div className="text-green-400 font-medium">
                    {grant.vestedShares.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Unvested</div>
                  <div className="text-purple-400 font-medium">
                    {(grant.totalShares - grant.vestedShares).toLocaleString()}
                  </div>
                </div>
              </div>

              {grant.strikePrice && (
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <div className="text-sm text-slate-400">Strike Price</div>
                    <div className="text-white">{formatCurrency(grant.strikePrice)}</div>
                  </div>
                  {grant.currentPrice && (
                    <div>
                      <div className="text-sm text-slate-400">Current Price</div>
                      <div className="text-white">{formatCurrency(grant.currentPrice)}</div>
                    </div>
                  )}
                  {gainPerShare !== null && (
                    <div>
                      <div className="text-sm text-slate-400">Gain/Share</div>
                      <div className={gainPerShare >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {formatCurrency(gainPerShare)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Vesting Progress</span>
                  <span className="text-white">{vestingProgress}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${vestingProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {grants.length === 0 && (
        <div className="text-center text-slate-400 py-8">No equity grants found</div>
      )}
    </div>
  )
}
