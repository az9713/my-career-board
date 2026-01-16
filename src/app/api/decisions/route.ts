import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createDecision, getUserDecisions } from '@/lib/decisions/service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    const filters: any = {}
    if (status) filters.status = status
    if (category) filters.category = category

    const decisions = await getUserDecisions(session.user.id, filters)

    return NextResponse.json({ decisions })
  } catch (error) {
    console.error('Error fetching decisions:', error)
    return NextResponse.json({ error: 'Failed to fetch decisions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const decision = await createDecision({
      ...body,
      userId: session.user.id,
    })

    return NextResponse.json({ decision }, { status: 201 })
  } catch (error) {
    console.error('Error creating decision:', error)
    return NextResponse.json({ error: 'Failed to create decision' }, { status: 500 })
  }
}
