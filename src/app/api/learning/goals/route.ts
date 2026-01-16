import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  createLearningGoal,
  getUserLearningGoals,
} from '@/lib/learning/service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const goals = await getUserLearningGoals(
      session.user.id,
      status || undefined
    )

    return NextResponse.json(goals)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      skillGapId,
      targetDate,
      resources,
      milestones,
      priority,
    } = body

    if (!title || !targetDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const goal = await createLearningGoal({
      userId: session.user.id,
      title,
      description,
      skillGapId,
      targetDate: new Date(targetDate),
      resources,
      milestones,
      priority,
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}
