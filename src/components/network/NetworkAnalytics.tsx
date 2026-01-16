'use client'

interface NetworkAnalyticsProps {
  analytics: {
    totalContacts: number
    byRelationship: Record<string, number>
    totalInteractions: number
    staleContacts: { id: string; name: string }[]
  }
}

const relationshipColors: Record<string, string> = {
  mentor: 'bg-purple-500',
  mentee: 'bg-green-500',
  peer: 'bg-blue-500',
  sponsor: 'bg-yellow-500',
  colleague: 'bg-slate-500',
  recruiter: 'bg-orange-500',
}

export function NetworkAnalytics({ analytics }: NetworkAnalyticsProps) {
  const { totalContacts, byRelationship, totalInteractions, staleContacts } = analytics

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-3xl font-bold text-white">{totalContacts}</div>
          <div className="text-sm text-slate-400">Total Contacts</div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-3xl font-bold text-white">{totalInteractions}</div>
          <div className="text-sm text-slate-400">Total Interactions</div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-3xl font-bold text-orange-400">{staleContacts.length}</div>
          <div className="text-sm text-slate-400">Stale Contacts</div>
        </div>
      </div>

      {/* Relationship Breakdown */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h3 className="text-lg font-medium text-white mb-4">Network Composition</h3>
        <div className="space-y-3">
          {Object.entries(byRelationship).map(([relationship, count]) => {
            const percentage = totalContacts > 0 ? (count / totalContacts) * 100 : 0
            return (
              <div key={relationship}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300 capitalize">{relationship}</span>
                  <span className="text-white font-medium">{count}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${relationshipColors[relationship] || 'bg-slate-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stale Contacts Warning */}
      {staleContacts.length > 0 && (
        <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-4">
          <h3 className="text-orange-300 font-medium mb-2">
            Contacts Needing Attention
          </h3>
          <p className="text-slate-400 text-sm mb-3">
            These contacts haven&apos;t been contacted in over 90 days
          </p>
          <div className="flex flex-wrap gap-2">
            {staleContacts.slice(0, 5).map((contact) => (
              <span
                key={contact.id}
                className="px-2 py-1 bg-slate-700 rounded text-sm text-white"
              >
                {contact.name}
              </span>
            ))}
            {staleContacts.length > 5 && (
              <span className="px-2 py-1 text-slate-400 text-sm">
                +{staleContacts.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
