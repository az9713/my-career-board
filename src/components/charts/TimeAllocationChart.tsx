'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'

interface TimeAllocationData {
  name: string
  allocation: number
  color?: string
}

interface TimeAllocationChartProps {
  data: TimeAllocationData[]
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function TimeAllocationChart({ data }: TimeAllocationChartProps) {
  if (data.length === 0) {
    return (
      <div
        data-testid="time-allocation-chart"
        className="bg-slate-800 rounded-lg p-6 text-center"
      >
        <h3 className="text-lg font-medium text-white mb-4">Time Allocation</h3>
        <p className="text-slate-400">No problems in your portfolio yet.</p>
      </div>
    )
  }

  // Add colors if not present
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }))

  return (
    <div data-testid="time-allocation-chart" className="bg-slate-800 rounded-lg p-6">
      <h3 className="text-lg font-medium text-white mb-4">Time Allocation</h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="allocation"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, allocation }) => `${allocation}%`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${value}%`, 'Allocation']}
            />
            <Legend
              formatter={(value) => (
                <span className="text-slate-300">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-2">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-300">{item.name}</span>
            </div>
            <span className="text-slate-400">{item.allocation}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
