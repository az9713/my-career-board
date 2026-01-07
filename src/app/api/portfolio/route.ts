import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma/client'

// GET /api/portfolio - Get user's problem portfolio
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const problems = await prisma.problem.findMany({
      where: { userId: session.user.id },
      orderBy: { timeAllocation: 'desc' },
    })

    return NextResponse.json(problems)
  } catch (error) {
    console.error('Get portfolio error:', error)
    return NextResponse.json(
      { error: 'Failed to get portfolio' },
      { status: 500 }
    )
  }
}
