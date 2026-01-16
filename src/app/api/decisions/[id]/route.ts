import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getDecisionById, updateDecision, deleteDecision } from '@/lib/decisions/service'

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
    const decision = await getDecisionById(id)

    if (!decision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 })
    }

    if (decision.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ decision })
  } catch (error) {
    console.error('Error fetching decision:', error)
    return NextResponse.json({ error: 'Failed to fetch decision' }, { status: 500 })
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
    const existingDecision = await getDecisionById(id)

    if (!existingDecision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 })
    }

    if (existingDecision.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const decision = await updateDecision(id, body)

    return NextResponse.json({ decision })
  } catch (error) {
    console.error('Error updating decision:', error)
    return NextResponse.json({ error: 'Failed to update decision' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existingDecision = await getDecisionById(id)

    if (!existingDecision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 })
    }

    if (existingDecision.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await deleteDecision(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting decision:', error)
    return NextResponse.json({ error: 'Failed to delete decision' }, { status: 500 })
  }
}
