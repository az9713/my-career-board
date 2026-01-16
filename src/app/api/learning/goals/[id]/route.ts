import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getLearningGoalById,
  updateLearningGoal,
} from '@/lib/learning/service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const goal = await getLearningGoalById(id)

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    return NextResponse.json(goal)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 })
  }
}

export async function PUT(
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

    const goal = await updateLearningGoal(id, body)

    return NextResponse.json(goal)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
  }
}
