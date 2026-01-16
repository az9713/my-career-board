import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  createEquityGrant,
  getUserEquityGrants,
} from '@/lib/compensation/service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const grants = await getUserEquityGrants(session.user.id)

    return NextResponse.json(grants)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch grants' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      company,
      grantType,
      grantDate,
      totalShares,
      strikePrice,
      currentPrice,
      cliffMonths,
      vestingMonths,
      vestingSchedule,
      expirationDate,
      notes,
    } = body

    if (!company || !grantType || !grantDate || !totalShares) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const grant = await createEquityGrant({
      userId: session.user.id,
      company,
      grantType,
      grantDate: new Date(grantDate),
      totalShares,
      strikePrice,
      currentPrice,
      cliffMonths,
      vestingMonths,
      vestingSchedule,
      expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      notes,
    })

    return NextResponse.json(grant, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create grant' }, { status: 500 })
  }
}
