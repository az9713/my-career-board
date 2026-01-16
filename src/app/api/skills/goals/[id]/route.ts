import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { updateSkillGoalProgress } from '@/lib/skills/service'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { progress } = body

    if (progress === undefined) {
      return NextResponse.json({ error: 'Progress is required' }, { status: 400 })
    }

    const goal = await updateSkillGoalProgress(id, progress)
    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Error updating skill goal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
