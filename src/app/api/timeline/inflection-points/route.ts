import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getInflectionPoints } from '@/lib/timeline/service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const inflectionPoints = await getInflectionPoints(session.user.id)

    return NextResponse.json({ inflectionPoints })
  } catch (error) {
    console.error('Error fetching inflection points:', error)
    return NextResponse.json({ error: 'Failed to fetch inflection points' }, { status: 500 })
  }
}
