import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getDecisionById, recordOutcome } from '@/lib/decisions/service'

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
    const existingDecision = await getDecisionById(id)

    if (!existingDecision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 })
    }

    if (existingDecision.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    if (!body.actualOutcome) {
      return NextResponse.json({ error: 'Actual outcome is required' }, { status: 400 })
    }

    const outcome = await recordOutcome({
      decisionId: id,
      actualOutcome: body.actualOutcome,
      accuracy: body.accuracy,
      lessonsLearned: body.lessonsLearned,
    })

    return NextResponse.json({ outcome }, { status: 201 })
  } catch (error) {
    console.error('Error recording outcome:', error)
    return NextResponse.json({ error: 'Failed to record outcome' }, { status: 500 })
  }
}
