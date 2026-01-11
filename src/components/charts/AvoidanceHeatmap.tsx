'use client'

interface AvoidanceData {
  theme: string
  frequency: number
  lastMentioned?: string
}

interface AvoidanceHeatmapProps {
  data: AvoidanceData[]
}

function getHeatColor(frequency: number, maxFrequency: number): string {
  const intensity = maxFrequency > 0 ? frequency / maxFrequency : 0

  if (intensity >= 0.8) return 'bg-red-600'
  if (intensity >= 0.6) return 'bg-red-500'
  if (intensity >= 0.4) return 'bg-orange-500'
  if (intensity >= 0.2) return 'bg-yellow-500'
  return 'bg-yellow-400'
}

export function AvoidanceHeatmap({ data }: AvoidanceHeatmapProps) {
  if (data.length === 0) {
    return (
      <div
        data-testid="avoidance-heatmap"
        className="bg-slate-800 rounded-lg p-6 text-center"
      >
        <h3 className="text-lg font-medium text-white mb-4">Avoidance Patterns</h3>
        <p className="text-slate-400">No patterns detected yet.</p>
      </div>
    )
  }

  const maxFrequency = Math.max(...data.map((d) => d.frequency))

  return (
    <div data-testid="avoidance-heatmap" className="bg-slate-800 rounded-lg p-6">
      <h3 className="text-lg font-medium text-white mb-4">Avoidance Patterns</h3>

      <div className="space-y-3">
        {data.map((item, index) => (
          <div
            key={index}
            data-testid="heatmap-cell"
            className="flex items-center gap-3"
          >
            <div
              className={`w-8 h-8 rounded ${getHeatColor(item.frequency, maxFrequency)} flex items-center justify-center`}
            >
              <span className="text-white text-sm font-medium">
                {item.frequency}
              </span>
            </div>
            <div className="flex-1">
              <span className="text-slate-200 capitalize">{item.theme}</span>
              {item.lastMentioned && (
                <span className="text-slate-500 text-sm ml-2">
                  Last: {new Date(item.lastMentioned).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(item.frequency, 5) }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-4 rounded-sm ${getHeatColor(item.frequency, maxFrequency)}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Frequency Scale</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 rounded bg-yellow-400" />
            <span className="text-slate-500 text-xs mx-1">Low</span>
            <div className="w-4 h-3 rounded bg-orange-500" />
            <span className="text-slate-500 text-xs mx-1">Med</span>
            <div className="w-4 h-3 rounded bg-red-600" />
            <span className="text-slate-500 text-xs ml-1">High</span>
          </div>
        </div>
      </div>
    </div>
  )
}
