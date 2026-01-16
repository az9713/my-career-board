import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getCompensationAnalytics,
  getMarketBenchmark,
} from '@/lib/compensation/service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const level = searchParams.get('level')

    // If role and level provided, get benchmark comparison
    if (role && level) {
      const benchmark = await getMarketBenchmark(role, level)
      return NextResponse.json({ benchmark })
    }

    // Otherwise return user analytics
    const analytics = await getCompensationAnalytics(session.user.id)

    return NextResponse.json(analytics)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
