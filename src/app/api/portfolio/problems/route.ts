import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma/client'

// POST /api/portfolio/problems - Create a new problem
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const problem = await prisma.problem.create({
      data: {
        userId: session.user.id,
        name: data.name,
        whatBreaks: data.whatBreaks,
        scarcitySignals: JSON.stringify(data.scarcitySignals || []),
        aiCheaper: data.aiCheaper,
        errorCost: data.errorCost,
        trustRequired: data.trustRequired,
        classification: data.classification || 'uncertain',
        classificationReasoning: data.classificationReasoning,
        timeAllocation: data.timeAllocation,
      },
    })

    return NextResponse.json(problem)
  } catch (error) {
    console.error('Create problem error:', error)
    return NextResponse.json(
      { error: 'Failed to create problem' },
      { status: 500 }
    )
  }
}
