import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getPendingInvites, acceptInvite, declineInvite } from '@/lib/team/service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invites = await getPendingInvites(session.user.id)

    return NextResponse.json({ invites })
  } catch (error) {
    console.error('Error fetching invites:', error)
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { inviteId, action } = body

    if (!inviteId || !action) {
      return NextResponse.json(
        { error: 'Invite ID and action are required' },
        { status: 400 }
      )
    }

    let result
    if (action === 'accept') {
      result = await acceptInvite(session.user.id, inviteId)
    } else if (action === 'decline') {
      result = await declineInvite(session.user.id, inviteId)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error responding to invite:', error)
    return NextResponse.json({ error: 'Failed to respond to invite' }, { status: 500 })
  }
}
