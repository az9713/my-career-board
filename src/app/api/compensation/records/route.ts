import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  createCompensationRecord,
  getUserCompensationHistory,
} from '@/lib/compensation/service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const options = type ? { type } : undefined
    const records = await getUserCompensationHistory(session.user.id, options)

    return NextResponse.json(records)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, amount, effectiveDate, company, role, currency, notes } = body

    if (!type || !amount || !effectiveDate || !company || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const record = await createCompensationRecord({
      userId: session.user.id,
      type,
      amount,
      effectiveDate: new Date(effectiveDate),
      company,
      role,
      currency,
      notes,
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
  }
}
