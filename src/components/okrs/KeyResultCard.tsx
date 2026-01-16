'use client'

import { useState } from 'react'

interface KeyResultCardProps {
  keyResult: {
    id: string
    title: string
    description?: string
    metricType: string
    targetValue: number
    currentValue: number
    startValue: number
    unit?: string
    progress: number
    status: string
  }
  onCheckIn?: (id: string, value: number, notes?: string) => void
}

const statusColors: Record<string, string> = {
  'on-track': 'border-green-500/50',
  'at-risk': 'border-yellow-500/50',
  behind: 'border-red-500/50',
  completed: 'border-blue-500/50',
}

export function KeyResultCard({ keyResult, onCheckIn }: KeyResultCardProps) {
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [newValue, setNewValue] = useState(keyResult.currentValue.toString())
  const [notes, setNotes] = useState('')

  const handleCheckIn = () => {
    onCheckIn?.(keyResult.id, parseFloat(newValue), notes || undefined)
    setShowCheckIn(false)
    setNotes('')
  }

  return (
    <div className={`bg-slate-800 rounded-lg border-l-4 ${statusColors[keyResult.status] || 'border-slate-600'} p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-white font-medium">{keyResult.title}</h4>
          {keyResult.description && (
            <p className="text-slate-400 text-sm mt-1">{keyResult.description}</p>
          )}
        </div>
        <span className="text-white font-bold">{keyResult.progress}%</span>
      </div>

      <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${keyResult.progress}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
        <div>
          <div className="text-slate-400">Start</div>
          <div className="text-white">
            {keyResult.startValue}
            {keyResult.unit && <span className="text-slate-400 ml-1">{keyResult.unit}</span>}
          </div>
        </div>
        <div>
          <div className="text-slate-400">Current</div>
          <div className="text-white font-medium">
            {keyResult.currentValue}
            {keyResult.unit && <span className="text-slate-400 ml-1">{keyResult.unit}</span>}
          </div>
        </div>
        <div>
          <div className="text-slate-400">Target</div>
          <div className="text-green-400">
            {keyResult.targetValue}
            {keyResult.unit && <span className="text-slate-400 ml-1">{keyResult.unit}</span>}
          </div>
        </div>
      </div>

      {!showCheckIn ? (
        <button
          onClick={() => setShowCheckIn(true)}
          className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
        >
          Check-in
        </button>
      ) : (
        <div className="space-y-2 bg-slate-900/50 rounded-lg p-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">New Value</label>
            <input
              type="number"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What changed?"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCheckIn}
              className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium"
            >
              Save
            </button>
            <button
              onClick={() => setShowCheckIn(false)}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
