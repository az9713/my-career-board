import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createSkill, getUserSkills } from '@/lib/skills/service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined

    const skills = await getUserSkills(session.user.id, category)
    return NextResponse.json({ skills })
  } catch (error) {
    console.error('Error fetching skills:', error)
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
    const { name, category, proficiency, targetLevel, yearsExperience, notes } = body

    if (!name || !category || proficiency === undefined) {
      return NextResponse.json(
        { error: 'Name, category, and proficiency are required' },
        { status: 400 }
      )
    }

    const skill = await createSkill({
      userId: session.user.id,
      name,
      category,
      proficiency,
      targetLevel,
      yearsExperience,
      notes,
    })

    return NextResponse.json({ skill }, { status: 201 })
  } catch (error) {
    console.error('Error creating skill:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
