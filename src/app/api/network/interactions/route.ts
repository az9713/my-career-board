import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { logInteraction } from '@/lib/network/service'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const interaction = await logInteraction(body)

    return NextResponse.json({ interaction }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log interaction' }, { status: 500 })
  }
}
