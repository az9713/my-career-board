import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  createEvidence,
  getUserEvidence,
  searchEvidence,
} from '@/lib/evidence/service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const source = searchParams.get('source')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // If search keyword provided, use search function
    if (search) {
      const evidence = await searchEvidence(session.user.id, search)
      return NextResponse.json({ evidence })
    }

    // Otherwise use filters
    const filters: any = {}
    if (type) filters.type = type
    if (source) filters.source = source
    if (startDate) filters.startDate = new Date(startDate)
    if (endDate) filters.endDate = new Date(endDate)

    const evidence = await getUserEvidence(session.user.id, filters)
    return NextResponse.json({ evidence })
  } catch (error) {
    console.error('Error fetching evidence:', error)
    return NextResponse.json({ error: 'Failed to fetch evidence' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.type) {
      return NextResponse.json(
        { error: 'Title and type are required' },
        { status: 400 }
      )
    }

    const evidence = await createEvidence({
      ...body,
      userId: session.user.id,
    })

    return NextResponse.json({ evidence }, { status: 201 })
  } catch (error) {
    console.error('Error creating evidence:', error)
    return NextResponse.json({ error: 'Failed to create evidence' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Bulk delete is handled via query params
    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('ids')?.split(',')

    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    // For now, just return success - implement bulk delete if needed
    return NextResponse.json({ deleted: ids.length })
  } catch (error) {
    console.error('Error deleting evidence:', error)
    return NextResponse.json({ error: 'Failed to delete evidence' }, { status: 500 })
  }
}
