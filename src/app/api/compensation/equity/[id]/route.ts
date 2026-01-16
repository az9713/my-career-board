import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getEquityGrantById,
  updateEquityGrant,
} from '@/lib/compensation/service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const grant = await getEquityGrantById(id)

    if (!grant) {
      return NextResponse.json({ error: 'Grant not found' }, { status: 404 })
    }

    return NextResponse.json(grant)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch grant' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const grant = await updateEquityGrant(id, body)

    return NextResponse.json(grant)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update grant' }, { status: 500 })
  }
}
