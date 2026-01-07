'use client'

import { useEffect, useState, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, Users } from 'lucide-react'
import { DIRECTOR_PERSONAS, DirectorPersona } from '@/lib/directors/personas'
import { BOARD_MEETING_PHASES } from '@/lib/board/phases'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  speaker?: string
  directorName?: string
  directorAvatar?: string
}

interface SessionData {
  id: string
  quarter: string
  currentPhase: number
  status: string
  messages: Array<{
    id: string
    speaker: string
    content: string
    metadata?: string
  }>
}

export default function BoardMeetingPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [currentPhase, setCurrentPhase] = useState(0)
  const [quarter, setQuarter] = useState('')
  const [error, setError] = useState<string | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`)
        if (!res.ok) throw new Error('Session not found')

        const data: SessionData = await res.json()

        if (data.status === 'completed') {
          router.push(`/history/${sessionId}`)
          return
        }

        setQuarter(data.quarter || '')
        setCurrentPhase(data.currentPhase)

        // Convert messages
        const convertedMessages: Message[] = data.messages.map(m => {
          const metadata = m.metadata ? JSON.parse(m.metadata) : {}
          const director = DIRECTOR_PERSONAS.find(d => d.id === m.speaker)

          return {
            id: m.id,
            role: m.speaker === 'user' ? 'user' : 'assistant',
            content: m.content,
            speaker: m.speaker,
            directorName: director?.name || metadata.directorName,
            directorAvatar: director?.avatar,
          }
        })

        setMessages(convertedMessages)

        // If no messages, add opening message
        if (convertedMessages.length === 0) {
          const openingDirector = DIRECTOR_PERSONAS.find(d => d.id === 'strategist')
          setMessages([{
            id: 'opening',
            role: 'assistant',
            content: BOARD_MEETING_PHASES[0].questions[0],
            speaker: 'strategist',
            directorName: openingDirector?.name,
            directorAvatar: openingDirector?.avatar,
          }])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [sessionId, router])

  const sendMessage = async () => {
    if (!input.trim() || isSending) return

    const userMessage = input.trim()
    setInput('')
    setIsSending(true)
    setError(null)

    // Add user message immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
    }
    setMessages(prev => [...prev, tempUserMessage])

    try {
      const res = await fetch(`/api/board/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })

      if (!res.ok) throw new Error('Failed to send message')

      const data = await res.json()

      // Add director response
      const directorMessage: Message = {
        id: `response-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        speaker: data.director.id,
        directorName: data.director.name,
        directorAvatar: data.director.avatar,
      }

      setMessages(prev => [...prev, directorMessage])
      setCurrentPhase(data.currentPhase)

      if (data.isComplete) {
        setTimeout(() => {
          router.push(`/history/${sessionId}`)
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getDirectorColor = (speaker?: string) => {
    const director = DIRECTOR_PERSONAS.find(d => d.id === speaker)
    if (!director) return 'slate'
    return director.color
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error && messages.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-red-800 bg-red-900/20">
          <CardContent className="pt-6">
            <p className="text-red-200">{error}</p>
            <Button className="mt-4" variant="outline" onClick={() => router.push('/board')}>
              Back to Board
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const phase = BOARD_MEETING_PHASES[currentPhase] || BOARD_MEETING_PHASES[0]

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Board Meeting</h1>
          <p className="text-sm text-slate-400">{quarter}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="border-slate-600">
            Phase: {phase.name}
          </Badge>
          <div className="flex -space-x-2">
            {DIRECTOR_PERSONAS.map((d) => (
              <div
                key={d.id}
                className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-sm"
                title={d.name}
              >
                {d.avatar}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <Card className="flex-1 border-slate-700 bg-slate-800/50 overflow-hidden">
        <CardContent className="p-4 h-full flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 mr-3">
                    <div className={`w-10 h-10 rounded-full bg-${getDirectorColor(message.speaker)}-900/50 flex items-center justify-center text-lg`}>
                      {message.directorAvatar || <Users className="h-5 w-5" />}
                    </div>
                  </div>
                )}
                <div
                  className={`max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-2'
                      : 'bg-slate-700 text-white rounded-2xl rounded-bl-md px-4 py-3'
                  }`}
                >
                  {message.role === 'assistant' && message.directorName && (
                    <p className={`text-xs text-${getDirectorColor(message.speaker)}-400 font-medium mb-1`}>
                      {message.directorName}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="flex-shrink-0 mr-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                </div>
                <div className="bg-slate-700 text-slate-400 rounded-2xl rounded-bl-md px-4 py-3">
                  <p className="text-sm">Thinking...</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            {error && (
              <p className="text-red-400 text-sm mb-2">{error}</p>
            )}
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share your thoughts with the board..."
                className="flex-1 bg-slate-900 border-slate-600 text-white resize-none min-h-[60px]"
                disabled={isSending}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isSending}
                className="bg-blue-600 hover:bg-blue-700 self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
