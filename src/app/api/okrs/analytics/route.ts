import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getOKRAnalytics } from '@/lib/okrs/service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const analytics = await getOKRAnalytics(session.user.id)

    return NextResponse.json({ analytics })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
