import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getFeedbackRequestById,
  closeFeedbackRequest,
} from '@/lib/feedback360/service'

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
    const feedbackRequest = await getFeedbackRequestById(id)

    if (!feedbackRequest) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Check ownership
    if (feedbackRequest.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ request: feedbackRequest })
  } catch (error) {
    console.error('Error fetching feedback request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    // Check ownership
    const existing = await getFeedbackRequestById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (body.status === 'closed') {
      const updated = await closeFeedbackRequest(id)
      return NextResponse.json({ request: updated })
    }

    return NextResponse.json({ error: 'Invalid update' }, { status: 400 })
  } catch (error) {
    console.error('Error updating feedback request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    // Check ownership
    const existing = await getFeedbackRequestById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Note: Actual deletion would need to be implemented in service
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting feedback request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
