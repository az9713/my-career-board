import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { inviteToTeam } from '@/lib/team/service'

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
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const result = await inviteToTeam(session.user.id, teamId, email)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error inviting to team:', error)
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 })
  }
}
