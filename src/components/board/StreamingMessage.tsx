'use client'

import { useEffect, useState, useRef } from 'react'

export interface DirectorInfo {
  id: string
  name: string
  avatar: string
  color: string
  title?: string
}

interface StreamingMessageProps {
  sessionId: string
  message: string
  onComplete: (fullText: string) => void
  onError?: (error: Error) => void
  director?: DirectorInfo
}

export function StreamingMessage({
  sessionId,
  message,
  onComplete,
  onError,
  director: initialDirector,
}: StreamingMessageProps) {
  const [text, setText] = useState('')
  const [isStreaming, setIsStreaming] = useState(true)
  const [director, setDirector] = useState<DirectorInfo | undefined>(initialDirector)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    // Construct the SSE URL
    const url = new URL(`/api/board/${sessionId}/stream`, window.location.origin)
    url.searchParams.set('message', message)

    // Create EventSource connection
    const eventSource = new EventSource(url.toString())
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsStreaming(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'director' && data.director) {
          setDirector(data.director)
        } else if (data.type === 'text' && data.text) {
          setText((prev) => prev + data.text)
        } else if (data.type === 'done') {
          setIsStreaming(false)
          eventSource.close()
          onComplete(data.fullText || text)
        } else if (data.type === 'error') {
          setIsStreaming(false)
          eventSource.close()
          onError?.(new Error(data.error || 'Stream error'))
        }
      } catch (e) {
        console.error('Failed to parse SSE data:', e)
      }
    }

    eventSource.onerror = () => {
      setIsStreaming(false)
      eventSource.close()
      onError?.(new Error('Connection error'))
    }

    // Cleanup on unmount
    return () => {
      eventSource.close()
    }
  }, [sessionId, message, onComplete, onError, text])

  // Loading state before any text arrives
  if (!text && isStreaming) {
    return (
      <div className="flex items-start gap-3 p-4" data-testid="streaming-loading">
        {director && (
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xl">
              {director.avatar}
            </div>
          </div>
        )}
        <div className="flex-1">
          {director && (
            <div className="text-sm font-medium text-white mb-1">
              {director.name}
            </div>
          )}
          <div className="flex items-center gap-2 text-slate-400">
            <span className="animate-pulse">Thinking</span>
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 p-4">
      {director && (
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xl">
            {director.avatar}
          </div>
        </div>
      )}
      <div className="flex-1">
        {director && (
          <div className="text-sm font-medium text-white mb-1">
            {director.name}
          </div>
        )}
        <div className="text-slate-200 whitespace-pre-wrap">
          {text}
          {isStreaming && (
            <span
              data-testid="typing-indicator"
              className="inline-block w-2 h-4 bg-blue-400 ml-0.5 animate-pulse"
            />
          )}
        </div>
      </div>
    </div>
  )
}
