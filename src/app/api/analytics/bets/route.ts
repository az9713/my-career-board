import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getBetAccuracyTrend } from '@/lib/analytics/service'

// GET /api/analytics/bets - Get bet accuracy trend data
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const trend = await getBetAccuracyTrend(session.user.id)

    return NextResponse.json({ trend })
  } catch (error) {
    console.error('Bet analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bet analytics' },
      { status: 500 }
    )
  }
}
