import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createNetworkingGoal, getUserNetworkingGoals } from '@/lib/network/service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined

    const goals = await getUserNetworkingGoals(session.user.id, status)

    return NextResponse.json({ goals })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const goal = await createNetworkingGoal({
      userId: session.user.id,
      ...body,
    })

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}
