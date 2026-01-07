import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma/client'

// POST /api/board - Start a new board meeting session
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { quarter } = await request.json()

    // Create new board session
    const boardSession = await prisma.boardSession.create({
      data: {
        userId: session.user.id,
        sessionType: 'board_meeting',
        quarter: quarter || `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`,
        status: 'in_progress',
        currentPhase: 0,
      },
    })

    return NextResponse.json({
      id: boardSession.id,
      quarter: boardSession.quarter,
      currentPhase: boardSession.currentPhase,
      status: boardSession.status,
    })
  } catch (error) {
    console.error('Create board session error:', error)
    return NextResponse.json(
      { error: 'Failed to create board session' },
      { status: 500 }
    )
  }
}

// GET /api/board - List user's board meetings
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessions = await prisma.boardSession.findMany({
      where: {
        userId: session.user.id,
        sessionType: 'board_meeting',
      },
      orderBy: { startedAt: 'desc' },
      take: 20,
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('List board sessions error:', error)
    return NextResponse.json(
      { error: 'Failed to list board sessions' },
      { status: 500 }
    )
  }
}
