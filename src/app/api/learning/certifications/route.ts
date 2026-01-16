import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  createCertification,
  getUserCertifications,
  getExpiringCertifications,
} from '@/lib/learning/service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const expiring = searchParams.get('expiring')

    if (expiring) {
      const days = parseInt(expiring) || 30
      const certs = await getExpiringCertifications(session.user.id, days)
      return NextResponse.json(certs)
    }

    const certifications = await getUserCertifications(
      session.user.id,
      status || undefined
    )

    return NextResponse.json(certifications)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      issuer,
      credentialId,
      credentialUrl,
      skillId,
      earnedAt,
      expiresAt,
      renewalCost,
      notes,
    } = body

    if (!name || !issuer || !earnedAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const certification = await createCertification({
      userId: session.user.id,
      name,
      issuer,
      credentialId,
      credentialUrl,
      skillId,
      earnedAt: new Date(earnedAt),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      renewalCost,
      notes,
    })

    return NextResponse.json(certification, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create certification' }, { status: 500 })
  }
}
