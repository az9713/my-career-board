import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getFeedbackRequestById,
  getFeedbackResults,
  compareFeedbackToSelfAssessment,
} from '@/lib/feedback360/service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check ownership
    const feedbackRequest = await getFeedbackRequestById(id)
    if (!feedbackRequest) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (feedbackRequest.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get aggregated results
    const results = await getFeedbackResults(id)

    // Get comparison with self-assessment
    const comparison = await compareFeedbackToSelfAssessment(id)

    return NextResponse.json({
      results,
      comparison,
    })
  } catch (error) {
    console.error('Error fetching feedback results:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
