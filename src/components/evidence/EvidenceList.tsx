'use client'

import { useState, useEffect } from 'react'
import { EvidenceCard } from './EvidenceCard'

interface Evidence {
  id: string
  title: string
  type: string
  description?: string
  date: string
  source?: string
  impact?: string
}

interface EvidenceListProps {
  evidence: Evidence[]
  showFilters?: boolean
  showSearch?: boolean
  onFilterChange?: (filters: { type?: string }) => void
  onSearch?: (query: string) => void
  onEdit?: (evidence: Evidence) => void
  onDelete?: (id: string) => void
}

export function EvidenceList({
  evidence,
  showFilters = false,
  showSearch = false,
  onFilterChange,
  onSearch,
  onEdit,
  onDelete,
}: EvidenceListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    if (onSearch && searchQuery) {
      const timer = setTimeout(() => {
        onSearch(searchQuery)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [searchQuery, onSearch])

  const handleTypeChange = (type: string) => {
    setTypeFilter(type)
    if (onFilterChange) {
      onFilterChange({ type: type || undefined })
    }
  }

  if (evidence.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-lg">No evidence yet</p>
        <p className="text-sm mt-2">Start documenting your wins and feedback!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {(showFilters || showSearch) && (
        <div className="flex gap-4 mb-6">
          {showSearch && (
            <input
              type="text"
              placeholder="Search evidence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            />
          )}
          {showFilters && (
            <div>
              <label htmlFor="typeFilter" className="sr-only">
                Filter by type
              </label>
              <select
                id="typeFilter"
                value={typeFilter}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                aria-label="Filter by type"
              >
                <option value="">All types</option>
                <option value="win">Wins</option>
                <option value="feedback">Feedback</option>
                <option value="metric">Metrics</option>
                <option value="artifact">Artifacts</option>
                <option value="milestone">Milestones</option>
              </select>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {evidence.map((item) => (
          <EvidenceCard
            key={item.id}
            evidence={item}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}
