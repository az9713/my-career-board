import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createBet, getUserBets } from '@/lib/bets/service'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.content || !body.falsifiableCriteria || !body.deadline || !body.quarter) {
      return NextResponse.json(
        { error: 'Missing required fields: content, falsifiableCriteria, deadline, quarter' },
        { status: 400 }
      )
    }

    const bet = await createBet({
      userId: session.user.id,
      content: body.content,
      falsifiableCriteria: body.falsifiableCriteria,
      deadline: new Date(body.deadline),
      quarter: body.quarter,
    })

    return NextResponse.json(bet, { status: 201 })
  } catch (error) {
    console.error('Error creating bet:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create bet' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bets = await getUserBets(session.user.id)

    return NextResponse.json(bets)
  } catch (error) {
    console.error('Error fetching bets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bets' },
      { status: 500 }
    )
  }
}
