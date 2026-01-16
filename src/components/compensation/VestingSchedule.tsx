'use client'

interface Vesting {
  id: string
  vestDate: string
  shares: number
  vested: boolean
  vestedAt?: string
}

interface Grant {
  id: string
  company: string
  totalShares: number
  vestedShares: number
  grantDate: string
  cliffMonths: number
  vestingMonths: number
  vestings: Vesting[]
}

interface VestingScheduleProps {
  grant: Grant
}

export function VestingSchedule({ grant }: VestingScheduleProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const unvestedShares = grant.totalShares - grant.vestedShares
  const vestingProgress = Math.round((grant.vestedShares / grant.totalShares) * 100)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">Vesting Schedule</h3>

      <div className="bg-slate-900 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-sm text-slate-400">Vested</div>
            <div className="text-xl font-bold text-green-400">
              {grant.vestedShares.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-400">Unvested</div>
            <div className="text-xl font-bold text-purple-400">
              {unvestedShares.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-400">Total</div>
            <div className="text-xl font-bold text-white">
              {grant.totalShares.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Progress</span>
            <span className="text-white">{vestingProgress}%</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
              style={{ width: `${vestingProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium text-slate-300">Vesting Events</div>
        {grant.vestings.map((vesting) => (
          <div
            key={vesting.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              vesting.vested
                ? 'bg-green-900/20 border-green-700/50'
                : 'bg-slate-800 border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  vesting.vested ? 'bg-green-500' : 'bg-slate-500'
                }`}
              />
              <div>
                <div className="text-white">{vesting.shares.toLocaleString()} shares</div>
                <div className="text-sm text-slate-400">
                  {formatDate(vesting.vestDate)}
                </div>
              </div>
            </div>
            <div
              className={`text-sm font-medium ${
                vesting.vested ? 'text-green-400' : 'text-slate-400'
              }`}
            >
              {vesting.vested ? 'Vested' : 'Pending'}
            </div>
          </div>
        ))}
      </div>

      {grant.vestings.length === 0 && (
        <div className="text-center text-slate-400 py-4">
          No vesting events scheduled
        </div>
      )}
    </div>
  )
}
