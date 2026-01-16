import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  createFeedbackRequest,
  getUserFeedbackRequests,
  addFeedbackQuestion,
  addFeedbackRecipient,
} from '@/lib/feedback360/service'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requests = await getUserFeedbackRequests(session.user.id)
    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching feedback requests:', error)
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
    const { title, description, anonymous, expiresAt, questions, recipients } = body

    // Create the feedback request
    const feedbackRequest = await createFeedbackRequest({
      userId: session.user.id,
      title,
      description,
      anonymous: anonymous ?? true,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    })

    // Add questions if provided
    if (questions && Array.isArray(questions)) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        await addFeedbackQuestion({
          requestId: feedbackRequest.id,
          question: q.question,
          category: q.category,
          type: q.type || 'scale',
          options: q.options,
          order: i,
        })
      }
    }

    // Add recipients if provided
    if (recipients && Array.isArray(recipients)) {
      for (const r of recipients) {
        await addFeedbackRecipient({
          requestId: feedbackRequest.id,
          email: r.email,
          name: r.name,
          relationship: r.relationship,
        })
      }
    }

    return NextResponse.json({ request: feedbackRequest }, { status: 201 })
  } catch (error) {
    console.error('Error creating feedback request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
