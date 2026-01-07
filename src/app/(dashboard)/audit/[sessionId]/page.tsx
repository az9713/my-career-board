'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Loader2, Send, CheckCircle2, AlertTriangle } from 'lucide-react'
import { auditQuestions, AuditQuestion } from '@/lib/audit/questions'

interface GateResult {
  passed: boolean
  isSpecific: boolean
  reason: string
  challengeMessage?: string
  attemptCount?: number
}

interface SessionData {
  id: string
  currentPhase: number
  status: string
  messages: Array<{
    id: string
    speaker: string
    content: string
    messageType: string
    metadata?: string
  }>
}

export default function AuditSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const router = useRouter()

  const [session, setSession] = useState<SessionData | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<AuditQuestion | null>(null)
  const [response, setResponse] = useState('')
  const [attemptCount, setAttemptCount] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gateResult, setGateResult] = useState<GateResult | null>(null)

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`)
        if (!res.ok) {
          throw new Error('Session not found')
        }
        const data = await res.json()
        setSession(data)

        if (data.status === 'completed') {
          router.push(`/audit/${sessionId}/results`)
          return
        }

        setCurrentQuestion(auditQuestions[data.currentPhase] || null)

        // Check if there's a pending challenge from previous attempts
        const lastMessage = data.messages[data.messages.length - 1]
        if (lastMessage?.messageType === 'challenge') {
          const metadata = lastMessage.metadata ? JSON.parse(lastMessage.metadata) : {}
          setAttemptCount(metadata.attemptCount + 1 || 2)
          setGateResult({
            passed: false,
            isSpecific: false,
            reason: '',
            challengeMessage: lastMessage.content,
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [sessionId, router])

  const submitAnswer = async () => {
    if (!response.trim() || !currentQuestion) return

    setIsSubmitting(true)
    setError(null)
    setGateResult(null)

    try {
      const res = await fetch(`/api/sessions/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response, attemptCount }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit answer')
      }

      const data = await res.json()
      setGateResult(data.gateResult)

      if (data.gateResult.passed) {
        if (data.isComplete) {
          router.push(`/audit/${sessionId}/results`)
        } else {
          // Move to next question
          setCurrentQuestion(data.nextQuestion)
          setResponse('')
          setAttemptCount(1)
          setGateResult(null)
          setSession(prev => prev ? { ...prev, currentPhase: data.nextPhase } : null)
        }
      } else {
        // Gate challenge - increment attempt count
        setAttemptCount(data.gateResult.attemptCount + 1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-red-800 bg-red-900/20">
          <CardContent className="pt-6">
            <p className="text-red-200">{error}</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => router.push('/audit')}
            >
              Back to Audit
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progress = session ? ((session.currentPhase) / auditQuestions.length) * 100 : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-slate-400">
          <span>Question {(session?.currentPhase || 0) + 1} of {auditQuestions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question card */}
      {currentQuestion && (
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {currentQuestion.question}
              </h2>
              <p className="text-slate-400 mt-2 text-sm">
                {currentQuestion.subtext}
              </p>
            </div>

            {/* Gate challenge feedback */}
            {gateResult && !gateResult.passed && gateResult.challengeMessage && (
              <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-amber-200 font-medium">Not specific enough</p>
                    <p className="text-amber-200/80 text-sm mt-1">
                      {gateResult.challengeMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success feedback (briefly shown) */}
            {gateResult?.passed && (
              <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-green-200 font-medium">
                      {gateResult.isSpecific ? 'Specific and clear' : 'Accepted'}
                    </p>
                    <p className="text-green-200/80 text-sm mt-1">
                      {gateResult.reason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Textarea
              placeholder={currentQuestion.placeholder}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="min-h-[120px] bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              disabled={isSubmitting}
            />

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Attempt {attemptCount} of 3
                {attemptCount > 1 && ' • Be more specific'}
              </p>
              <Button
                onClick={submitAnswer}
                disabled={!response.trim() || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    Submit
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
