import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getTimelineWithPhases } from '@/lib/timeline/service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await getTimelineWithPhases(session.user.id)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching full timeline:', error)
    return NextResponse.json({ error: 'Failed to fetch timeline' }, { status: 500 })
  }
}
