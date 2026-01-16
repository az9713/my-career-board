import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getTodayPrompt } from '@/lib/checkins/service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rotate = searchParams.get('rotate') === 'true'

    const prompt = await getTodayPrompt(session.user.id, { rotate })

    if (!prompt) {
      return NextResponse.json(
        { error: 'No prompt available' },
        { status: 404 }
      )
    }

    return NextResponse.json({ prompt })
  } catch (error) {
    console.error('Error fetching today\'s prompt:', error)
    return NextResponse.json({ error: 'Failed to fetch prompt' }, { status: 500 })
  }
}
