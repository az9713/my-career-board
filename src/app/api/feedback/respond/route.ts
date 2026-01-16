import { NextRequest, NextResponse } from 'next/server'
import {
  getResponseByToken,
  submitFeedbackResponse,
} from '@/lib/feedback360/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, relationship, answers } = body

    // Get recipient by token
    const recipient = await getResponseByToken(token)
    if (!recipient) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
    }

    // Check if already responded
    if (recipient.responded) {
      return NextResponse.json({ error: 'Already submitted' }, { status: 400 })
    }

    // Submit response
    const response = await submitFeedbackResponse({
      requestId: recipient.request.id,
      recipientToken: token,
      relationship: relationship || recipient.relationship,
      answers: answers || [],
    })

    return NextResponse.json({ response }, { status: 201 })
  } catch (error) {
    console.error('Error submitting feedback response:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET to fetch the feedback form by token (no auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const recipient = await getResponseByToken(token)
    if (!recipient) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
    }

    if (recipient.responded) {
      return NextResponse.json({ error: 'Already submitted' }, { status: 400 })
    }

    // Return the feedback request details (without sensitive info)
    return NextResponse.json({
      request: {
        id: recipient.request.id,
        title: recipient.request.title,
        questions: recipient.request.questions,
        anonymous: true, // Always return as anonymous for privacy
      },
    })
  } catch (error) {
    console.error('Error fetching feedback form:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
