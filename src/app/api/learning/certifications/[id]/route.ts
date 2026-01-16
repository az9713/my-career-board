import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getCertificationById,
  updateCertification,
} from '@/lib/learning/service'

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
    const certification = await getCertificationById(id)

    if (!certification) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 })
    }

    return NextResponse.json(certification)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch certification' }, { status: 500 })
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
    const body = await request.json()

    const certification = await updateCertification(id, body)

    return NextResponse.json(certification)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update certification' }, { status: 500 })
  }
}
