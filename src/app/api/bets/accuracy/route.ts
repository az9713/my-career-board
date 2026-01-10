import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { calculateAccuracy } from '@/lib/bets/service'

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for quarter filter in query params
    const { searchParams } = new URL(request.url)
    const quarter = searchParams.get('quarter') || undefined

    const accuracy = await calculateAccuracy(session.user.id, quarter)

    return NextResponse.json(accuracy)
  } catch (error) {
    console.error('Error calculating accuracy:', error)
    return NextResponse.json(
      { error: 'Failed to calculate accuracy' },
      { status: 500 }
    )
  }
}
