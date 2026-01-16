import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { recordVesting, getUpcomingVestings } from '@/lib/compensation/service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const vestings = await getUpcomingVestings(session.user.id, days)

    return NextResponse.json(vestings)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch vestings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { vestingId, grantId, shares } = body

    if (!vestingId || !grantId || !shares) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await recordVesting(vestingId, grantId, shares)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record vesting' }, { status: 500 })
  }
}
