import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSkillsAnalytics } from '@/lib/skills/service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const analytics = await getSkillsAnalytics(session.user.id)
    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Error fetching skills analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
