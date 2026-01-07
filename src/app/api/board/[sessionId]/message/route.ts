import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma/client'
import {
  generateBoardResponse,
  initializeOrchestrator,
  OrchestratorState,
  ConversationMessage,
} from '@/lib/llm/orchestrator'

// POST /api/board/[sessionId]/message - Send a message to the board
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await params
    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get the board session
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
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Get user's portfolio for context
    const portfolio = await prisma.problem.findMany({
      where: { userId: session.user.id },
      orderBy: { timeAllocation: 'desc' },
    })

    if (boardSession.status === 'completed') {
      return NextResponse.json({ error: 'Session already completed' }, { status: 400 })
    }

    // Reconstruct orchestrator state from messages
    const conversationHistory: ConversationMessage[] = boardSession.messages.map(m => ({
      role: m.speaker === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content,
      speaker: m.speaker !== 'user' ? m.speaker : undefined,
    }))

    const orchestratorState: OrchestratorState = {
      currentPhase: boardSession.currentPhase,
      conversationHistory,
      activeDirector: 'accountability_hawk', // Will be determined by phase
      phaseQuestionIndex: 0,
    }

    // Store user message
    await prisma.sessionMessage.create({
      data: {
        sessionId,
        speaker: 'user',
        content: message,
        messageType: 'user_message',
      },
    })

    // Generate board response with portfolio context
    const { response, director, newState } = await generateBoardResponse(
      orchestratorState,
      message,
      portfolio
    )

    // Store director response
    await prisma.sessionMessage.create({
      data: {
        sessionId,
        speaker: director.id,
        content: response,
        messageType: 'director_response',
        metadata: JSON.stringify({
          directorName: director.name,
          directorTitle: director.title,
          phase: newState.currentPhase,
        }),
      },
    })

    // Update session phase if changed
    if (newState.currentPhase !== boardSession.currentPhase) {
      await prisma.boardSession.update({
        where: { id: sessionId },
        data: { currentPhase: newState.currentPhase },
      })
    }

    // Check if meeting should end (after phase 5)
    const isComplete = newState.currentPhase >= 5 &&
      newState.conversationHistory.filter(m => m.role === 'user').length >= 10

    if (isComplete) {
      await prisma.boardSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      response,
      director: {
        id: director.id,
        name: director.name,
        title: director.title,
        avatar: director.avatar,
        color: director.color,
      },
      currentPhase: newState.currentPhase,
      isComplete,
    })
  } catch (error) {
    console.error('Board message error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
