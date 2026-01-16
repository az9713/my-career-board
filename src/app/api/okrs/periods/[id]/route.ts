import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getOKRPeriodById, updateOKRPeriod } from '@/lib/okrs/service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const period = await getOKRPeriodById(id)

    if (!period) {
      return NextResponse.json({ error: 'Period not found' }, { status: 404 })
    }

    return NextResponse.json({ period })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch period' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const period = await updateOKRPeriod(id, body)

    return NextResponse.json({ period })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update period' }, { status: 500 })
  }
}
