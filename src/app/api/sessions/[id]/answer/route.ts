import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma/client'
import { checkSpecificityGate } from '@/lib/llm/gates'
import { getQuestionByIndex, auditQuestions } from '@/lib/audit/questions'

// POST /api/sessions/[id]/answer - Submit an answer to current question
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { response, attemptCount = 1 } = await request.json()

    if (!response || typeof response !== 'string') {
      return NextResponse.json(
        { error: 'Response is required' },
        { status: 400 }
      )
    }

    // Get the session
    const boardSession = await prisma.boardSession.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!boardSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (boardSession.status === 'completed') {
      return NextResponse.json(
        { error: 'Session already completed' },
        { status: 400 }
      )
    }

    // Get current question
    const currentPhase = boardSession.currentPhase
    const question = getQuestionByIndex(currentPhase)

    if (!question) {
      return NextResponse.json(
        { error: 'Invalid question phase' },
        { status: 400 }
      )
    }

    // Run specificity gate check
    const gateResult = await checkSpecificityGate(
      response,
      question,
      attemptCount
    )

    // Store the user's message
    await prisma.sessionMessage.create({
      data: {
        sessionId: id,
        speaker: 'user',
        content: response,
        messageType: 'answer',
        metadata: JSON.stringify({
          questionId: question.id,
          gateResult: gateResult.passed ? 'passed' : 'challenged',
          attemptCount,
        }),
      },
    })

    // If gate passed, advance to next question or complete
    if (gateResult.passed) {
      const nextPhase = currentPhase + 1
      const isComplete = nextPhase >= auditQuestions.length

      await prisma.boardSession.update({
        where: { id },
        data: {
          currentPhase: nextPhase,
          status: isComplete ? 'completed' : 'in_progress',
          completedAt: isComplete ? new Date() : null,
        },
      })

      // If there's a note about why it was accepted (after max attempts), store it
      if (!gateResult.isSpecific) {
        await prisma.sessionMessage.create({
          data: {
            sessionId: id,
            speaker: 'system',
            content: gateResult.reason,
            messageType: 'gate_note',
            metadata: JSON.stringify({ questionId: question.id }),
          },
        })
      }

      return NextResponse.json({
        gateResult: {
          passed: true,
          isSpecific: gateResult.isSpecific,
          reason: gateResult.reason,
        },
        nextPhase: isComplete ? null : nextPhase,
        isComplete,
        nextQuestion: isComplete ? null : getQuestionByIndex(nextPhase),
      })
    }

    // Gate failed - store challenge message
    await prisma.sessionMessage.create({
      data: {
        sessionId: id,
        speaker: 'system',
        content: gateResult.challengeMessage || gateResult.reason,
        messageType: 'challenge',
        metadata: JSON.stringify({
          questionId: question.id,
          attemptCount: gateResult.attemptCount,
        }),
      },
    })

    return NextResponse.json({
      gateResult: {
        passed: false,
        isSpecific: false,
        reason: gateResult.reason,
        challengeMessage: gateResult.challengeMessage,
        attemptCount: gateResult.attemptCount,
      },
      nextPhase: null,
      isComplete: false,
    })
  } catch (error) {
    console.error('Submit answer error:', error)
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    )
  }
}
