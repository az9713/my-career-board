import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { updateKeyResult, checkInKeyResult, getKeyResultById, calculateObjectiveProgress } from '@/lib/okrs/service'

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
    const keyResult = await updateKeyResult(id, body)

    return NextResponse.json({ keyResult })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update key result' }, { status: 500 })
  }
}

export async function POST(
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
    const checkIn = await checkInKeyResult(id, body.value, body.notes)

    // Get the key result to find its objective and recalculate progress
    const keyResult = await getKeyResultById(id)
    if (keyResult) {
      await calculateObjectiveProgress(keyResult.objective?.id || '')
    }

    return NextResponse.json({ checkIn }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check in' }, { status: 500 })
  }
}
