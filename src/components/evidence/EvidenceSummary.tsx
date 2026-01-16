'use client'

interface EvidenceSummaryData {
  totalCount: number
  byType: Record<string, number>
  bySource: Record<string, number>
  recentEvidence: Array<{
    id: string
    title: string
    type: string
  }>
}

interface EvidenceSummaryProps {
  summary: EvidenceSummaryData
}

const typeLabels: Record<string, string> = {
  win: 'Wins',
  feedback: 'Feedback',
  metric: 'Metrics',
  artifact: 'Artifacts',
  milestone: 'Milestones',
}

export function EvidenceSummary({ summary }: EvidenceSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Total count */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 text-center">
        <div className="text-4xl font-bold text-white">{summary.totalCount}</div>
        <div className="text-slate-400 mt-1">Total Evidence</div>
      </div>

      {/* Breakdown by type */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <h3 className="text-lg font-medium text-white mb-4">By Type</h3>
        <div className="space-y-2">
          {Object.entries(summary.byType).map(([type, count]) => (
            <div key={type} className="flex justify-between items-center">
              <span className="text-slate-300">{typeLabels[type] || type}</span>
              <span className="text-white font-medium">
                {count} {typeLabels[type]?.toLowerCase() || type}
              </span>
            </div>
          ))}
          {Object.keys(summary.byType).length === 0 && (
            <p className="text-slate-500 text-sm">No evidence recorded yet</p>
          )}
        </div>
      </div>

      {/* Breakdown by source */}
      {Object.keys(summary.bySource).length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <h3 className="text-lg font-medium text-white mb-4">By Source</h3>
          <div className="space-y-2">
            {Object.entries(summary.bySource).map(([source, count]) => (
              <div key={source} className="flex justify-between items-center">
                <span className="text-slate-300 capitalize">{source}</span>
                <span className="text-white font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent evidence */}
      {summary.recentEvidence.length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <h3 className="text-lg font-medium text-white mb-4">Recent</h3>
          <div className="space-y-2">
            {summary.recentEvidence.map((evidence) => (
              <div
                key={evidence.id}
                className="flex items-center gap-2 text-sm"
              >
                <span className="px-2 py-0.5 rounded bg-slate-700 text-xs">
                  {evidence.type}
                </span>
                <span className="text-slate-300">{evidence.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
