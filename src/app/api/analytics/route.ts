import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  calculateBetAccuracy,
  getBetAccuracyTrend,
  getTimeAllocationHistory,
  getAvoidancePatterns,
} from '@/lib/analytics/service'

// GET /api/analytics - Get comprehensive analytics data
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Fetch all analytics data in parallel
    const [betAccuracy, betTrend, timeAllocation, avoidancePatterns] = await Promise.all([
      calculateBetAccuracy(userId),
      getBetAccuracyTrend(userId),
      getTimeAllocationHistory(userId),
      getAvoidancePatterns(userId),
    ])

    return NextResponse.json({
      betAccuracy,
      betTrend,
      timeAllocation,
      avoidancePatterns,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
