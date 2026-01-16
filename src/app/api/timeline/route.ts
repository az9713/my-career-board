import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createTimelineEvent, getUserTimeline } from '@/lib/timeline/service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const filters: any = {}
    if (type) filters.type = type
    if (startDate) filters.startDate = new Date(startDate)
    if (endDate) filters.endDate = new Date(endDate)

    const events = await getUserTimeline(session.user.id, filters)

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching timeline:', error)
    return NextResponse.json({ error: 'Failed to fetch timeline' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.title || !body.date || !body.type) {
      return NextResponse.json(
        { error: 'Title, date, and type are required' },
        { status: 400 }
      )
    }

    const event = await createTimelineEvent({
      ...body,
      userId: session.user.id,
      date: new Date(body.date),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Error creating timeline event:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
