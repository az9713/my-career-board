'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, ArrowRight, Home, RotateCcw } from 'lucide-react'
import { auditQuestions } from '@/lib/audit/questions'

interface SessionMessage {
  id: string
  speaker: string
  content: string
  messageType: string
  metadata?: string
  createdAt: string
}

interface SessionData {
  id: string
  currentPhase: number
  status: string
  startedAt: string
  completedAt: string
  messages: SessionMessage[]
}

interface AnswerSummary {
  questionId: string
  question: string
  answer: string
  wasSpecific: boolean
  attempts: number
}

export default function AuditResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const router = useRouter()

  const [session, setSession] = useState<SessionData | null>(null)
  const [answers, setAnswers] = useState<AnswerSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`)
        if (!res.ok) {
          throw new Error('Session not found')
        }
        const data: SessionData = await res.json()

        if (data.status !== 'completed') {
          router.push(`/audit/${sessionId}`)
          return
        }

        setSession(data)

        // Parse answers from messages
        const answerSummaries: AnswerSummary[] = []

        for (const q of auditQuestions) {
          // Find all user answers for this question
          const questionAnswers = data.messages.filter(m => {
            if (m.messageType !== 'answer') return false
            const metadata = m.metadata ? JSON.parse(m.metadata) : {}
            return metadata.questionId === q.id
          })

          if (questionAnswers.length > 0) {
            // Get the final (passed) answer
            const finalAnswer = questionAnswers[questionAnswers.length - 1]
            const metadata = finalAnswer.metadata ? JSON.parse(finalAnswer.metadata) : {}

            answerSummaries.push({
              questionId: q.id,
              question: q.question,
              answer: finalAnswer.content,
              wasSpecific: metadata.gateResult === 'passed',
              attempts: questionAnswers.length,
            })
          }
        }

        setAnswers(answerSummaries)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load results')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [sessionId, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error) {
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

  const totalAttempts = answers.reduce((sum, a) => sum + a.attempts, 0)
  const specificAnswers = answers.filter(a => a.wasSpecific).length
  const completionTime = session?.completedAt && session?.startedAt
    ? Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)
    : null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="p-3 rounded-full bg-green-900/50">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white">Audit Complete</h1>
        <p className="text-slate-400">
          You&apos;ve completed your quick audit. Here&apos;s what surfaced.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-white">{answers.length}</p>
            <p className="text-xs text-slate-400">Questions</p>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-white">{specificAnswers}/{answers.length}</p>
            <p className="text-xs text-slate-400">Specific</p>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-white">{completionTime || '?'}m</p>
            <p className="text-xs text-slate-400">Duration</p>
          </CardContent>
        </Card>
      </div>

      {/* Answers summary */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-white text-lg">Your Responses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {answers.map((answer, index) => (
            <div key={answer.questionId} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-slate-300 font-medium text-sm">
                  {index + 1}. {answer.question}
                </h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {answer.attempts > 1 && (
                    <Badge variant="outline" className="text-xs border-amber-700 text-amber-400">
                      {answer.attempts} attempts
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={answer.wasSpecific
                      ? 'border-green-700 text-green-400'
                      : 'border-slate-600 text-slate-400'
                    }
                  >
                    {answer.wasSpecific ? 'Specific' : 'Accepted'}
                  </Badge>
                </div>
              </div>
              <p className="text-white bg-slate-900/50 rounded-lg p-3 text-sm">
                {answer.answer}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Key takeaways placeholder */}
      <Card className="border-blue-800/50 bg-blue-900/20">
        <CardContent className="pt-6">
          <h3 className="text-blue-200 font-medium mb-2">What to do next</h3>
          <ul className="text-blue-200/80 text-sm space-y-2">
            <li>• Review your avoided decision and set a deadline</li>
            <li>• Schedule that conversation you&apos;ve been putting off</li>
            <li>• Block time for real work, not comfort work</li>
            <li>• Track your bet for next week</li>
          </ul>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => router.push('/dashboard')}
        >
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
        <Button
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          onClick={() => router.push('/audit')}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          New Audit
        </Button>
      </div>
    </div>
  )
}
