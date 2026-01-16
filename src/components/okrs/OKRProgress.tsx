'use client'

interface OKRProgressProps {
  progress: number
  size?: 'small' | 'medium' | 'large'
  status?: string
  showLabel?: boolean
}

const sizeConfig = {
  small: { size: 60, stroke: 4, fontSize: 'text-sm' },
  medium: { size: 80, stroke: 5, fontSize: 'text-base' },
  large: { size: 120, stroke: 6, fontSize: 'text-xl' },
}

const statusColors: Record<string, string> = {
  'on-track': '#22c55e',
  'at-risk': '#eab308',
  behind: '#ef4444',
  completed: '#3b82f6',
  default: '#3b82f6',
}

export function OKRProgress({ progress, size = 'medium', status, showLabel = true }: OKRProgressProps) {
  const config = sizeConfig[size]
  const radius = (config.size - config.stroke) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference
  const color = statusColors[status || 'default']

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={config.size}
        height={config.size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          stroke="#334155"
          strokeWidth={config.stroke}
        />
        {/* Progress circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={config.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      {showLabel && (
        <span className={`absolute ${config.fontSize} font-bold text-white`}>
          {progress}%
        </span>
      )}
    </div>
  )
}
