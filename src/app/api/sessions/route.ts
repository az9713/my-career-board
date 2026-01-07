import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma/client'

// POST /api/sessions - Create a new audit session
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionType = 'quick_audit' } = await request.json()

    // Create new session
    const boardSession = await prisma.boardSession.create({
      data: {
        userId: session.user.id,
        sessionType,
        status: 'in_progress',
        currentPhase: 0, // Start at question 0
      },
    })

    return NextResponse.json({
      id: boardSession.id,
      sessionType: boardSession.sessionType,
      currentPhase: boardSession.currentPhase,
      status: boardSession.status,
    })
  } catch (error) {
    console.error('Create session error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}

// GET /api/sessions - List user's sessions
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessions = await prisma.boardSession.findMany({
      where: { userId: session.user.id },
      orderBy: { startedAt: 'desc' },
      take: 20,
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('List sessions error:', error)
    return NextResponse.json(
      { error: 'Failed to list sessions' },
      { status: 500 }
    )
  }
}
