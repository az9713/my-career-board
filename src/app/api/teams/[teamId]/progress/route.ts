import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getTeamProgress } from '@/lib/team/service'

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
    const progress = await getTeamProgress(session.user.id, teamId)

    if (!progress) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    return NextResponse.json(progress)
  } catch (error) {
    console.error('Error fetching team progress:', error)
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }
}
