import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getDecisionAnalytics } from '@/lib/decisions/service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const analytics = await getDecisionAnalytics(session.user.id)

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Error fetching decision analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
