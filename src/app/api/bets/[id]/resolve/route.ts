import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { resolveBet, getBetById } from '@/lib/bets/service'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Validate outcome
    if (!body.outcome || !['hit', 'miss', 'excused'].includes(body.outcome)) {
      return NextResponse.json(
        { error: 'Invalid outcome. Must be: hit, miss, or excused' },
        { status: 400 }
      )
    }

    // Check if bet exists and belongs to user
    const existingBet = await getBetById(id)

    if (!existingBet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
    }

    if (existingBet.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedBet = await resolveBet(id, {
      outcome: body.outcome,
      evidence: body.evidence,
      reflection: body.reflection,
    })

    return NextResponse.json(resolvedBet)
  } catch (error) {
    console.error('Error resolving bet:', error)

    if (error instanceof Error && error.message === 'Bet has already been resolved') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resolve bet' },
      { status: 500 }
    )
  }
}
