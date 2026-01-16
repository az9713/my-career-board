'use client'

interface InflectionPoint {
  impact: string
  beforeState?: string | null
  afterState?: string | null
}

interface InflectionPointHighlightProps {
  inflectionPoint: InflectionPoint
}

export function InflectionPointHighlight({ inflectionPoint }: InflectionPointHighlightProps) {
  return (
    <div
      data-testid="inflection-highlight"
      className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg border border-yellow-700/50 p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">⚡</span>
        <span className="text-yellow-400 font-medium">Inflection Point</span>
      </div>

      <p className="text-white mb-4">{inflectionPoint.impact}</p>

      {(inflectionPoint.beforeState || inflectionPoint.afterState) && (
        <div className="flex items-center gap-4 text-sm">
          {inflectionPoint.beforeState && (
            <div className="flex-1">
              <div className="text-slate-500 mb-1">Before:</div>
              <div className="text-slate-300">{inflectionPoint.beforeState}</div>
            </div>
          )}

          {inflectionPoint.beforeState && inflectionPoint.afterState && (
            <div className="text-2xl text-slate-600">→</div>
          )}

          {inflectionPoint.afterState && (
            <div className="flex-1">
              <div className="text-slate-500 mb-1">After:</div>
              <div className="text-slate-300">{inflectionPoint.afterState}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
