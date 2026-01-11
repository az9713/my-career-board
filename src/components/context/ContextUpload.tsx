'use client'

import { useState, useCallback } from 'react'

type ContextType = 'resume' | 'linkedin' | 'document' | 'notes'

interface ContextUploadProps {
  onUploadComplete: () => void
}

export function ContextUpload({ onUploadComplete }: ContextUploadProps) {
  const [type, setType] = useState<ContextType>('resume')
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim() || !name.trim()) {
      setError('Please provide both name and content')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name, content }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setContent('')
      setName('')
      onUploadComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const handleFileDrop = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      if (name) formData.append('name', name)

      const response = await fetch('/api/context/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      onUploadComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
      setDragActive(false)
    }
  }, [type, name, onUploadComplete])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFileDrop(e.dataTransfer.files)
  }

  const getPlaceholder = () => {
    switch (type) {
      case 'resume':
        return 'Paste your resume content here...'
      case 'linkedin':
        return 'Paste your LinkedIn profile data (JSON or text)...'
      case 'document':
        return 'Paste document content here or use the file upload...'
      case 'notes':
        return 'Add any notes about your career, goals, or context...'
      default:
        return 'Enter content...'
    }
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h3 className="text-lg font-medium text-white mb-4">Add Context</h3>

      <div className="space-y-4">
        {/* Context Type Select */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ContextType)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="resume">Resume</option>
            <option value="linkedin">LinkedIn</option>
            <option value="document">Document</option>
            <option value="notes">Notes</option>
          </select>
        </div>

        {/* Name Input */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a name for this context..."
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* File Drop Zone (for document type) */}
        {type === 'document' && (
          <div
            data-testid="drop-zone"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-600 hover:border-slate-500'
            }`}
          >
            <p className="text-slate-400">
              Drop file here or{' '}
              <label className="text-blue-400 cursor-pointer hover:underline">
                browse
                <input
                  type="file"
                  className="hidden"
                  accept=".txt,.pdf,.doc,.docx,.json,.md"
                  onChange={(e) => handleFileDrop(e.target.files)}
                />
              </label>
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Supports: txt, pdf, doc, docx, json, md (max 5MB)
            </p>
          </div>
        )}

        {/* Text Content */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={getPlaceholder()}
            rows={6}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-2 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !content.trim() || !name.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Saving...' : 'Save Context'}
        </button>
      </div>
    </div>
  )
}
