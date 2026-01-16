import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createKeyResult } from '@/lib/okrs/service'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const keyResult = await createKeyResult(body)

    return NextResponse.json({ keyResult }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create key result' }, { status: 500 })
  }
}
