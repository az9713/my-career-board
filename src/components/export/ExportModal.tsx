'use client'

import { useState } from 'react'

type ExportType = 'quarterly' | 'bets' | 'session'
type ExportFormat = 'markdown' | 'json' | 'csv'

interface ExportOptions {
  format: ExportFormat
  quarter?: string
}

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: (options: ExportOptions) => void
  type: ExportType
}

const quarters = [
  'Q1-2025',
  'Q4-2024',
  'Q3-2024',
  'Q2-2024',
  'Q1-2024',
]

export function ExportModal({ isOpen, onClose, onExport, type }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>(
    type === 'bets' ? 'csv' : 'markdown'
  )
  const [quarter, setQuarter] = useState(quarters[0])

  if (!isOpen) {
    return null
  }

  const handleExport = () => {
    onExport({
      format,
      quarter: type === 'quarterly' ? quarter : undefined,
    })
  }

  const formatOptions: ExportFormat[] =
    type === 'bets' ? ['csv', 'json'] : ['markdown', 'json']

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-4">Export Options</h2>

        <div className="space-y-4">
          {/* Format Selection */}
          <div>
            <label
              htmlFor="format"
              className="block text-sm text-slate-400 mb-1"
            >
              Format
            </label>
            <select
              id="format"
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {formatOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'markdown'
                    ? 'Markdown (.md)'
                    : opt === 'csv'
                      ? 'CSV (.csv)'
                      : 'JSON (.json)'}
                </option>
              ))}
            </select>
          </div>

          {/* Quarter Selection (for quarterly export) */}
          {type === 'quarterly' && (
            <div>
              <label
                htmlFor="quarter"
                className="block text-sm text-slate-400 mb-1"
              >
                Quarter
              </label>
              <select
                id="quarter"
                value={quarter}
                onChange={(e) => setQuarter(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {quarters.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  )
}
