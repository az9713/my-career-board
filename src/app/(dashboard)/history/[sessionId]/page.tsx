import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import prisma from '@/lib/prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Clock, MessageSquare, Users, ClipboardCheck } from 'lucide-react'
import { DIRECTOR_PERSONAS } from '@/lib/directors/personas'
import { auditQuestions } from '@/lib/audit/questions'

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    notFound()
  }

  const boardSession = await prisma.boardSession.findFirst({
    where: {
      id: sessionId,
      userId: session.user.id,
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!boardSession) {
    notFound()
  }

  const isAudit = boardSession.sessionType === 'quick_audit'
  const duration = boardSession.completedAt
    ? Math.round((new Date(boardSession.completedAt).getTime() - new Date(boardSession.startedAt).getTime()) / 60000)
    : null

  // Group messages by question for audits, or as transcript for board meetings
  const getDirectorInfo = (speaker: string) => {
    const director = DIRECTOR_PERSONAS.find(d => d.id === speaker)
    return director || { name: speaker, avatar: '🤖', color: 'slate' }
  }

  const getQuestionForMessage = (metadata?: string | null) => {
    if (!metadata) return null
    try {
      const parsed = JSON.parse(metadata)
      return auditQuestions.find(q => q.id === parsed.questionId)
    } catch {
      return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/history">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      {/* Session info */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isAudit ? (
                <div className="p-2 rounded-lg bg-blue-900/50">
                  <ClipboardCheck className="h-6 w-6 text-blue-400" />
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-green-900/50">
                  <Users className="h-6 w-6 text-green-400" />
                </div>
              )}
              <div>
                <CardTitle className="text-white">
                  {isAudit ? 'Quick Audit' : `${boardSession.quarter || 'Quarterly'} Board Meeting`}
                </CardTitle>
                <p className="text-slate-400 text-sm">
                  {new Date(boardSession.startedAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <Badge
              className={
                boardSession.status === 'completed'
                  ? 'bg-green-900 text-green-300'
                  : 'bg-amber-900 text-amber-300'
              }
            >
              {boardSession.status === 'completed' ? 'Completed' : 'In Progress'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <MessageSquare className="h-4 w-4" />
              <span>{boardSession.messages.length} messages</span>
            </div>
            {duration && (
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="h-4 w-4" />
                <span>{duration} minutes</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transcript */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-white text-lg">Transcript</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {boardSession.messages.map((message, index) => {
            const isUser = message.speaker === 'user'
            const directorInfo = !isUser ? getDirectorInfo(message.speaker) : null
            const question = isAudit ? getQuestionForMessage(message.metadata) : null

            return (
              <div key={message.id}>
                {/* Show question header for audit messages */}
                {isAudit && question && index > 0 && (
                  boardSession.messages[index - 1]?.speaker !== 'user' ||
                  getQuestionForMessage(boardSession.messages[index - 1]?.metadata)?.id !== question.id
                ) && (
                  <div className="border-t border-slate-700 pt-4 mt-4 mb-2">
                    <p className="text-xs text-slate-500 font-medium">{question.question}</p>
                  </div>
                )}

                <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && directorInfo && (
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm">
                        {directorInfo.avatar}
                      </div>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] ${
                      isUser
                        ? 'bg-blue-600/20 border border-blue-600/30 rounded-2xl rounded-br-md px-4 py-2'
                        : 'bg-slate-700/50 rounded-2xl rounded-bl-md px-4 py-3'
                    }`}
                  >
                    {!isUser && directorInfo && (
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {directorInfo.name}
                      </p>
                    )}
                    {isUser && (
                      <p className="text-xs text-blue-400 font-medium mb-1">You</p>
                    )}
                    <p className="text-sm text-slate-200 whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            )
          })}

          {boardSession.messages.length === 0 && (
            <p className="text-slate-500 text-center py-8">No messages in this session</p>
          )}
        </CardContent>
      </Card>

      {/* Continue session if in progress */}
      {boardSession.status === 'in_progress' && (
        <div className="flex justify-center">
          <Link href={isAudit ? `/audit/${sessionId}` : `/board/${sessionId}`}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Continue Session
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
