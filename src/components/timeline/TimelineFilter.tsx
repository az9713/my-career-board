'use client'

import { useState } from 'react'

interface FilterOptions {
  type?: string
  startDate?: string
  endDate?: string
}

interface TimelineFilterProps {
  onFilterChange: (filters: FilterOptions) => void
  showDateRange?: boolean
}

const EVENT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'job', label: 'Job' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'decision', label: 'Decision' },
  { value: 'bet', label: 'Bet' },
]

export function TimelineFilter({ onFilterChange, showDateRange = false }: TimelineFilterProps) {
  const [type, setType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleTypeChange = (newType: string) => {
    setType(newType)
    onFilterChange({ type: newType || undefined, startDate: startDate || undefined, endDate: endDate || undefined })
  }

  const handleStartDateChange = (date: string) => {
    setStartDate(date)
    onFilterChange({ type: type || undefined, startDate: date || undefined, endDate: endDate || undefined })
  }

  const handleEndDateChange = (date: string) => {
    setEndDate(date)
    onFilterChange({ type: type || undefined, startDate: startDate || undefined, endDate: date || undefined })
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[150px]">
          <label htmlFor="type-filter" className="block text-sm font-medium text-slate-300 mb-1">
            Type
          </label>
          <select
            id="type-filter"
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
          >
            {EVENT_TYPES.map((eventType) => (
              <option key={eventType.value} value={eventType.value}>
                {eventType.label}
              </option>
            ))}
          </select>
        </div>

        {showDateRange && (
          <>
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="start-date" className="block text-sm font-medium text-slate-300 mb-1">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <label htmlFor="end-date" className="block text-sm font-medium text-slate-300 mb-1">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
