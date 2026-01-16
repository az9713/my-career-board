import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getUpcomingFollowUps } from '@/lib/network/service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7', 10)

    const followUps = await getUpcomingFollowUps(session.user.id, days)

    return NextResponse.json({ followUps })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch follow-ups' }, { status: 500 })
  }
}
