import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { analyzeSkillGaps } from '@/lib/skills/service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const analysis = await analyzeSkillGaps(session.user.id)
    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Error analyzing skill gaps:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
