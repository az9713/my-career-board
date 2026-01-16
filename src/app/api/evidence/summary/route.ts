import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getEvidenceSummary } from '@/lib/evidence/service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const options: { startDate?: Date; endDate?: Date } = {}
    if (startDate) options.startDate = new Date(startDate)
    if (endDate) options.endDate = new Date(endDate)

    const summary = await getEvidenceSummary(session.user.id, options)

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Error fetching evidence summary:', error)
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 })
  }
}
