import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getStreak } from '@/lib/checkins/service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const streak = await getStreak(session.user.id)

    if (!streak) {
      return NextResponse.json({
        streak: {
          currentStreak: 0,
          longestStreak: 0,
          lastCheckinAt: null,
        },
      })
    }

    return NextResponse.json({ streak })
  } catch (error) {
    console.error('Error fetching streak:', error)
    return NextResponse.json({ error: 'Failed to fetch streak' }, { status: 500 })
  }
}
