import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { givePeerFeedback, getPeerFeedback } from '@/lib/team/service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId } = await params
    const feedback = await getPeerFeedback(session.user.id, teamId)

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId } = await params
    const body = await request.json()
    const { toUserId, type, content } = body

    if (!toUserId || !type || !content) {
      return NextResponse.json(
        { error: 'toUserId, type, and content are required' },
        { status: 400 }
      )
    }

    const feedback = await givePeerFeedback(session.user.id, toUserId, teamId, {
      type,
      content,
    })

    return NextResponse.json({ feedback }, { status: 201 })
  } catch (error) {
    console.error('Error giving feedback:', error)
    return NextResponse.json({ error: 'Failed to give feedback' }, { status: 500 })
  }
}
