import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createObjective, getPeriodObjectives } from '@/lib/okrs/service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId')

    if (!periodId) {
      return NextResponse.json({ error: 'Period ID required' }, { status: 400 })
    }

    const objectives = await getPeriodObjectives(periodId)

    return NextResponse.json({ objectives })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch objectives' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const objective = await createObjective({
      userId: session.user.id,
      ...body,
    })

    return NextResponse.json({ objective }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create objective' }, { status: 500 })
  }
}
