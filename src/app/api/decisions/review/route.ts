import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getDecisionsDueForReview } from '@/lib/decisions/service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decisions = await getDecisionsDueForReview(session.user.id)

    return NextResponse.json({ decisions })
  } catch (error) {
    console.error('Error fetching decisions for review:', error)
    return NextResponse.json({ error: 'Failed to fetch decisions' }, { status: 500 })
  }
}
