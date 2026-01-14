import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  createCalendarEvent,
  getUpcomingEvents,
  deleteCalendarEvent,
  CalendarEventType,
} from '@/lib/calendar/service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type')
    const limit = searchParams.get('limit')

    const options: any = {}
    if (startDate) options.startDate = new Date(startDate)
    if (endDate) options.endDate = new Date(endDate)
    if (type) options.type = type
    if (limit) options.limit = parseInt(limit, 10)

    const events = await getUpcomingEvents(session.user.id, options)

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, type, startTime, endTime, description, reminders } = body

    // Validate required fields
    if (!title || !type || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: title, type, startTime, endTime' },
        { status: 400 }
      )
    }

    // Validate event type
    const validTypes = Object.values(CalendarEventType)
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      )
    }

    const event = await createCalendarEvent(session.user.id, {
      title,
      type,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      description,
      reminders,
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Error creating calendar event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    const result = await deleteCalendarEvent(session.user.id, eventId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting calendar event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}
