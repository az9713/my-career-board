import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getObjectiveById, updateObjective, deleteObjective } from '@/lib/okrs/service'

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
    const objective = await getObjectiveById(id)

    if (!objective) {
      return NextResponse.json({ error: 'Objective not found' }, { status: 404 })
    }

    return NextResponse.json({ objective })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch objective' }, { status: 500 })
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
    const objective = await updateObjective(id, body)

    return NextResponse.json({ objective })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update objective' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await deleteObjective(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete objective' }, { status: 500 })
  }
}
