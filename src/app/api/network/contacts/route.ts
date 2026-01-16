import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createContact, getUserContacts } from '@/lib/network/service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const relationship = searchParams.get('relationship')

    const filters = relationship ? { relationship } : undefined
    const contacts = await getUserContacts(session.user.id, filters)

    return NextResponse.json({ contacts })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const contact = await createContact({
      userId: session.user.id,
      ...body,
    })

    return NextResponse.json({ contact }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}
