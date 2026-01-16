import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createOKRPeriod, getUserOKRPeriods } from '@/lib/okrs/service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined

    const periods = await getUserOKRPeriods(session.user.id, status)

    return NextResponse.json({ periods })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch periods' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const period = await createOKRPeriod({
      userId: session.user.id,
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    })

    return NextResponse.json({ period }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create period' }, { status: 500 })
  }
}
