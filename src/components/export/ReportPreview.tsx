'use client'

import { useState, useEffect } from 'react'

type ExportType = 'quarterly' | 'bets' | 'session'

interface ReportPreviewProps {
  type: ExportType
  quarter?: string
  sessionId?: string
}

export function ReportPreview({ type, quarter, sessionId }: ReportPreviewProps) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPreview() {
      setLoading(true)
      setError(null)

      try {
        let url: string
        if (type === 'quarterly') {
          url = `/api/export/quarterly?quarter=${quarter}&format=markdown`
        } else if (type === 'bets') {
          url = `/api/export/bets?format=markdown`
        } else {
          url = `/api/export/session/${sessionId}?format=markdown`
        }

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error('Failed to load preview')
        }

        const text = await response.text()
        setContent(text)
      } catch (err) {
        setError('Failed to load preview')
      } finally {
        setLoading(false)
      }
    }

    fetchPreview()
  }, [type, quarter, sessionId])

  const handleDownload = async () => {
    let url: string
    if (type === 'quarterly') {
      url = `/api/export/quarterly?quarter=${quarter}&format=markdown&download=true`
    } else if (type === 'bets') {
      url = `/api/export/bets?format=csv&download=true`
    } else {
      url = `/api/export/session/${sessionId}?format=markdown&download=true`
    }

    const response = await fetch(url)
    const blob = await response.blob()
    const downloadUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `${type}-report.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(downloadUrl)
  }

  if (loading) {
    return (
      <div
        data-testid="preview-loading"
        className="bg-slate-800 rounded-lg p-6 animate-pulse"
      >
        <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-700 rounded w-full"></div>
          <div className="h-4 bg-slate-700 rounded w-5/6"></div>
          <div className="h-4 bg-slate-700 rounded w-4/6"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-red-400">
        {error}
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h3 className="text-lg font-medium text-white">Preview</h3>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
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
          Download
        </button>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
          {content}
        </pre>
      </div>
    </div>
  )
}
