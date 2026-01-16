import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getUpcomingEvents, generateICSFile } from '@/lib/calendar/service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const options: any = {}
    if (startDate) options.startDate = new Date(startDate)
    if (endDate) options.endDate = new Date(endDate)

    const events = await getUpcomingEvents(session.user.id, options)
    const icsContent = generateICSFile(events)

    const filename = `my-career-board-events-${new Date().toISOString().split('T')[0]}.ics`

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting calendar:', error)
    return NextResponse.json(
      { error: 'Failed to export calendar' },
      { status: 500 }
    )
  }
}
