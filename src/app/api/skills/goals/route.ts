import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSkillGoal, getUserSkillGoals } from '@/lib/skills/service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined

    const goals = await getUserSkillGoals(session.user.id, status)
    return NextResponse.json({ goals })
  } catch (error) {
    console.error('Error fetching skill goals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { skillId, skillName, targetLevel, deadline, reason, resources, milestones } = body

    if (!skillName || targetLevel === undefined) {
      return NextResponse.json(
        { error: 'skillName and targetLevel are required' },
        { status: 400 }
      )
    }

    const goal = await createSkillGoal({
      userId: session.user.id,
      skillId,
      skillName,
      targetLevel,
      deadline: deadline ? new Date(deadline) : undefined,
      reason,
      resources,
      milestones,
    })

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    console.error('Error creating skill goal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
