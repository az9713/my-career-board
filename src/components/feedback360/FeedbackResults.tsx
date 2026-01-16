'use client'

interface CategoryResult {
  average: number
  count: number
}

interface FeedbackResultsProps {
  results: {
    totalResponses: number
    byCategory: Record<string, CategoryResult>
    byRelationship: Record<string, Record<string, CategoryResult>>
  }
}

export function FeedbackResults({ results }: FeedbackResultsProps) {
  if (results.totalResponses === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No responses yet. Share your feedback link with colleagues to collect feedback.
      </div>
    )
  }

  const categories = Object.keys(results.byCategory)

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <div className="text-4xl font-bold text-white">{results.totalResponses}</div>
        <div className="text-slate-400">Total Responses</div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h3 className="text-lg font-medium text-white mb-4">Results by Category</h3>
        <div className="space-y-4">
          {categories.map((category) => {
            const data = results.byCategory[category]
            const percentage = (data.average / 5) * 100

            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300 capitalize">{category}</span>
                  <span className="text-white font-medium">{data.average.toFixed(1)}/5</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {Object.keys(results.byRelationship).length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-lg font-medium text-white mb-4">Results by Relationship</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(results.byRelationship).map(([relationship, categoryData]) => (
              <div key={relationship} className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-300 capitalize mb-2">
                  {relationship}
                </h4>
                {Object.entries(categoryData).map(([cat, data]) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span className="text-slate-400 capitalize">{cat}</span>
                    <span className="text-white">{data.average.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
