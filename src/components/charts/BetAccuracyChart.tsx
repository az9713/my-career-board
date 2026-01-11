'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface BetAccuracyData {
  quarter: string
  accuracy: number
  total: number
  hits: number
  misses: number
}

interface BetAccuracyChartProps {
  data: BetAccuracyData[]
  showTrend?: boolean
}

export function BetAccuracyChart({ data, showTrend = false }: BetAccuracyChartProps) {
  if (data.length === 0) {
    return (
      <div
        data-testid="bet-accuracy-chart"
        className="bg-slate-800 rounded-lg p-6 text-center"
      >
        <h3 className="text-lg font-medium text-white mb-4">Bet Accuracy</h3>
        <p className="text-slate-400">No data available yet. Complete some bets to see your accuracy trend.</p>
      </div>
    )
  }

  // Calculate trend
  const trend = data.length >= 2
    ? data[data.length - 1].accuracy - data[0].accuracy
    : 0

  return (
    <div data-testid="bet-accuracy-chart" className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Bet Accuracy</h3>
        {showTrend && data.length >= 2 && (
          <div
            data-testid="trend-indicator"
            className={`flex items-center gap-1 text-sm ${
              trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-slate-400'
            }`}
          >
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="quarter"
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={12}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#f1f5f9' }}
              formatter={(value: number, name: string) => [
                `${value}%`,
                name === 'accuracy' ? 'Accuracy' : name,
              ]}
            />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex gap-4 text-sm text-slate-400">
        <span>Total: {data.reduce((sum, d) => sum + d.total, 0)} bets</span>
        <span>Hits: {data.reduce((sum, d) => sum + d.hits, 0)}</span>
        <span>Misses: {data.reduce((sum, d) => sum + d.misses, 0)}</span>
      </div>
    </div>
  )
}
