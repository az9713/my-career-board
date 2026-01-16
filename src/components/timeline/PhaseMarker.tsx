'use client'

interface CareerPhase {
  id: string
  title: string
  description?: string | null
  startDate: string
  endDate: string | null
  color: string
}

interface PhaseMarkerProps {
  phase: CareerPhase
  onClick?: () => void
}

export function PhaseMarker({ phase, onClick }: PhaseMarkerProps) {
  const formatYear = (dateString: string) => {
    return new Date(dateString).getFullYear()
  }

  const getDateRange = () => {
    const startYear = formatYear(phase.startDate)
    if (!phase.endDate) {
      return `${startYear} - Present`
    }
    const endYear = formatYear(phase.endDate)
    return `${startYear} - ${endYear}`
  }

  return (
    <div
      data-testid="phase-marker"
      className="bg-slate-800 rounded-lg border-l-4 p-4 hover:bg-slate-750 transition-colors cursor-pointer"
      style={{ borderColor: phase.color }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-medium text-white">{phase.title}</h3>
        <span className="text-sm text-slate-400">{getDateRange()}</span>
      </div>

      {phase.description && (
        <p className="text-slate-400 text-sm">{phase.description}</p>
      )}
    </div>
  )
}
