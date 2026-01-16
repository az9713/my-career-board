import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getCheckinInsights } from '@/lib/checkins/service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const insights = await getCheckinInsights(session.user.id)

    return NextResponse.json({ insights })
  } catch (error) {
    console.error('Error fetching insights:', error)
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
  }
}
