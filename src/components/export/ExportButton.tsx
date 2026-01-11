'use client'

import { useState } from 'react'

type ExportType = 'quarterly' | 'bets' | 'session'
type ExportFormat = 'markdown' | 'json' | 'csv'

interface ExportButtonProps {
  type: ExportType
  quarter?: string
  sessionId?: string
}

const formatOptions: Record<ExportType, ExportFormat[]> = {
  quarterly: ['markdown', 'json'],
  bets: ['csv', 'json'],
  session: ['markdown', 'json'],
}

export function ExportButton({ type, quarter, sessionId }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async (format: ExportFormat) => {
    setLoading(true)
    setError(null)

    try {
      let url: string
      if (type === 'quarterly') {
        url = `/api/export/quarterly?quarter=${quarter}&format=${format}&download=true`
      } else if (type === 'bets') {
        url = `/api/export/bets?format=${format}&download=true`
      } else {
        url = `/api/export/session/${sessionId}?format=${format}&download=true`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)

      const extension = format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'md'
      const filename = `${type}-export.${extension}`

      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)

      setIsOpen(false)
    } catch (err) {
      setError('Export failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formats = formatOptions[type]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        disabled={loading}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        {loading ? 'Exporting...' : 'Export'}
      </button>

      {isOpen && !loading && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10">
          <div className="p-2">
            <div className="text-xs text-slate-400 px-2 py-1">Format</div>
            {formats.map((format) => (
              <button
                key={format}
                onClick={() => handleExport(format)}
                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 rounded transition-colors capitalize"
              >
                {format === 'markdown' ? 'Markdown (.md)' : format === 'csv' ? 'CSV (.csv)' : 'JSON (.json)'}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="absolute right-0 mt-2 px-3 py-2 bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg">
          {error}
        </div>
      )}
    </div>
  )
}
