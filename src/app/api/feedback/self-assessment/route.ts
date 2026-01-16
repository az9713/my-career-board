import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  createSelfAssessment,
  getSelfAssessments,
} from '@/lib/feedback360/service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined

    const assessments = await getSelfAssessments(session.user.id, category)

    return NextResponse.json({ assessments })
  } catch (error) {
    console.error('Error fetching self-assessments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { category, area, rating, notes } = body

    if (!category || !area || rating === undefined) {
      return NextResponse.json(
        { error: 'Category, area, and rating are required' },
        { status: 400 }
      )
    }

    const assessment = await createSelfAssessment({
      userId: session.user.id,
      category,
      area,
      rating,
      notes,
    })

    return NextResponse.json({ assessment }, { status: 201 })
  } catch (error) {
    console.error('Error creating self-assessment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
