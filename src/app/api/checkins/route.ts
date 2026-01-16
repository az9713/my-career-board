import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  createCheckin,
  getCheckinHistory,
  updateStreak,
} from '@/lib/checkins/service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = searchParams.get('limit')

    const options: any = {}
    if (startDate) options.startDate = new Date(startDate)
    if (endDate) options.endDate = new Date(endDate)
    if (limit) options.limit = parseInt(limit, 10)

    const checkins = await getCheckinHistory(session.user.id, options)

    return NextResponse.json({ checkins })
  } catch (error) {
    console.error('Error fetching check-ins:', error)
    return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.promptId || !body.response) {
      return NextResponse.json(
        { error: 'Prompt ID and response are required' },
        { status: 400 }
      )
    }

    const checkin = await createCheckin({
      userId: session.user.id,
      promptId: body.promptId,
      response: body.response,
      mood: body.mood,
    })

    // Update streak
    const streak = await updateStreak(session.user.id)

    return NextResponse.json({ checkin, streak }, { status: 201 })
  } catch (error) {
    console.error('Error creating check-in:', error)
    return NextResponse.json({ error: 'Failed to create check-in' }, { status: 500 })
  }
}
