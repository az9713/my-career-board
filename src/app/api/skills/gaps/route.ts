import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSkillGap, getUserSkillGaps } from '@/lib/skills/service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const priority = searchParams.get('priority') || undefined
    const status = searchParams.get('status') || undefined

    const gaps = await getUserSkillGaps(session.user.id, { priority, status })
    return NextResponse.json({ gaps })
  } catch (error) {
    console.error('Error fetching skill gaps:', error)
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
    const { skillName, currentLevel, requiredLevel, priority, source, targetRole, notes } = body

    if (!skillName || requiredLevel === undefined || !priority || !source) {
      return NextResponse.json(
        { error: 'skillName, requiredLevel, priority, and source are required' },
        { status: 400 }
      )
    }

    const gap = await createSkillGap({
      userId: session.user.id,
      skillName,
      currentLevel,
      requiredLevel,
      priority,
      source,
      targetRole,
      notes,
    })

    return NextResponse.json({ gap }, { status: 201 })
  } catch (error) {
    console.error('Error creating skill gap:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
