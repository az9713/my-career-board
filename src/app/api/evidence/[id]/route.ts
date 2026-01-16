import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getEvidenceById,
  updateEvidence,
  deleteEvidence,
} from '@/lib/evidence/service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const evidence = await getEvidenceById(id)

    if (!evidence) {
      return NextResponse.json({ error: 'Evidence not found' }, { status: 404 })
    }

    // Check ownership
    if (evidence.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ evidence })
  } catch (error) {
    console.error('Error fetching evidence:', error)
    return NextResponse.json({ error: 'Failed to fetch evidence' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existingEvidence = await getEvidenceById(id)

    if (!existingEvidence) {
      return NextResponse.json({ error: 'Evidence not found' }, { status: 404 })
    }

    // Check ownership
    if (existingEvidence.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const evidence = await updateEvidence(id, body)

    return NextResponse.json({ evidence })
  } catch (error) {
    console.error('Error updating evidence:', error)
    return NextResponse.json({ error: 'Failed to update evidence' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existingEvidence = await getEvidenceById(id)

    if (!existingEvidence) {
      return NextResponse.json({ error: 'Evidence not found' }, { status: 404 })
    }

    // Check ownership
    if (existingEvidence.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await deleteEvidence(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting evidence:', error)
    return NextResponse.json({ error: 'Failed to delete evidence' }, { status: 500 })
  }
}
