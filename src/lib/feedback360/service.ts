import prisma from '@/lib/prisma/client'
import { randomBytes } from 'crypto'

// Generate unique token for anonymous feedback
function generateToken(): string {
  return randomBytes(32).toString('hex')
}

// Create a new feedback request
export async function createFeedbackRequest(data: {
  userId: string
  title: string
  description?: string
  anonymous?: boolean
  expiresAt?: Date
}) {
  return prisma.feedbackRequest.create({
    data: {
      userId: data.userId,
      title: data.title,
      description: data.description,
      anonymous: data.anonymous ?? true,
      expiresAt: data.expiresAt,
    },
  })
}

// Get feedback request by ID with all related data
export async function getFeedbackRequestById(id: string) {
  return prisma.feedbackRequest.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
      responses: {
        include: {
          answers: true,
        },
      },
      recipients: true,
    },
  })
}

// Get all feedback requests for a user
export async function getUserFeedbackRequests(userId: string) {
  return prisma.feedbackRequest.findMany({
    where: { userId },
    include: {
      questions: true,
      responses: true,
      recipients: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

// Add a question to a feedback request
export async function addFeedbackQuestion(data: {
  requestId: string
  question: string
  category: string
  type?: string
  options?: string[]
  order?: number
}) {
  return prisma.feedbackQuestion.create({
    data: {
      requestId: data.requestId,
      question: data.question,
      category: data.category,
      type: data.type || 'scale',
      options: data.options ? JSON.stringify(data.options) : null,
      order: data.order || 0,
    },
  })
}

// Add a recipient to receive feedback request
export async function addFeedbackRecipient(data: {
  requestId: string
  email: string
  name?: string
  relationship?: string
}) {
  const token = generateToken()

  return prisma.feedbackRecipient.create({
    data: {
      requestId: data.requestId,
      email: data.email,
      name: data.name,
      relationship: data.relationship,
      token,
    },
  })
}

// Get recipient by token (for anonymous feedback submission)
export async function getResponseByToken(token: string) {
  return prisma.feedbackRecipient.findUnique({
    where: { token },
    include: {
      request: {
        include: {
          questions: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  })
}

// Submit feedback response
export async function submitFeedbackResponse(data: {
  requestId: string
  recipientToken?: string
  respondentId?: string
  relationship?: string
  answers: Array<{
    questionId: string
    scaleValue?: number
    textValue?: string
    choiceValue?: string
  }>
}) {
  // Create the response
  const response = await prisma.feedbackResponse.create({
    data: {
      requestId: data.requestId,
      respondentId: data.respondentId,
      relationship: data.relationship,
    },
  })

  // Create all answers
  if (data.answers.length > 0) {
    await prisma.feedbackQuestionResponse.createMany({
      data: data.answers.map((answer) => ({
        responseId: response.id,
        questionId: answer.questionId,
        scaleValue: answer.scaleValue,
        textValue: answer.textValue,
        choiceValue: answer.choiceValue,
      })),
    })
  }

  // Mark recipient as responded if token provided
  if (data.recipientToken) {
    await prisma.feedbackRecipient.update({
      where: { token: data.recipientToken },
      data: { responded: true },
    })
  }

  return response
}

// Get aggregated feedback results
export async function getFeedbackResults(requestId: string) {
  const request = await prisma.feedbackRequest.findUnique({
    where: { id: requestId },
    include: {
      questions: true,
      responses: {
        include: {
          answers: true,
        },
      },
    },
  })

  if (!request) {
    return null
  }

  // Aggregate by category
  const byCategory: Record<string, { total: number; count: number; average: number }> = {}

  // Aggregate by relationship
  const byRelationship: Record<string, Record<string, { total: number; count: number; average: number }>> = {}

  for (const response of request.responses) {
    const relationship = response.relationship || 'unknown'

    if (!byRelationship[relationship]) {
      byRelationship[relationship] = {}
    }

    for (const answer of response.answers) {
      if (answer.scaleValue === null) continue

      const question = request.questions.find((q) => q.id === answer.questionId)
      if (!question) continue

      const category = question.category

      // Update category totals
      if (!byCategory[category]) {
        byCategory[category] = { total: 0, count: 0, average: 0 }
      }
      byCategory[category].total += answer.scaleValue
      byCategory[category].count += 1
      byCategory[category].average = byCategory[category].total / byCategory[category].count

      // Update relationship totals
      if (!byRelationship[relationship][category]) {
        byRelationship[relationship][category] = { total: 0, count: 0, average: 0 }
      }
      byRelationship[relationship][category].total += answer.scaleValue
      byRelationship[relationship][category].count += 1
      byRelationship[relationship][category].average =
        byRelationship[relationship][category].total / byRelationship[relationship][category].count
    }
  }

  return {
    requestId,
    totalResponses: request.responses.length,
    byCategory,
    byRelationship,
  }
}

// Close a feedback request
export async function closeFeedbackRequest(requestId: string) {
  return prisma.feedbackRequest.update({
    where: { id: requestId },
    data: { status: 'closed' },
  })
}

// Create or update self-assessment
export async function createSelfAssessment(data: {
  userId: string
  category: string
  area: string
  rating: number
  notes?: string
}) {
  return prisma.selfAssessment.upsert({
    where: {
      id: `${data.userId}-${data.category}-${data.area}`, // This won't work - need proper unique constraint
    },
    create: {
      userId: data.userId,
      category: data.category,
      area: data.area,
      rating: data.rating,
      notes: data.notes,
    },
    update: {
      rating: data.rating,
      notes: data.notes,
    },
  })
}

// Get all self-assessments for a user
export async function getSelfAssessments(userId: string, category?: string) {
  return prisma.selfAssessment.findMany({
    where: {
      userId,
      ...(category && { category }),
    },
    orderBy: { category: 'asc' },
  })
}

// Compare feedback results to self-assessment
export async function compareFeedbackToSelfAssessment(requestId: string) {
  const request = await prisma.feedbackRequest.findUnique({
    where: { id: requestId },
    include: {
      questions: true,
      responses: {
        include: {
          answers: true,
        },
      },
    },
  })

  if (!request) {
    return null
  }

  const selfAssessments = await prisma.selfAssessment.findMany({
    where: { userId: request.userId },
  })

  // Calculate peer averages by category
  const peerAverages: Record<string, { total: number; count: number; average: number }> = {}

  for (const response of request.responses) {
    for (const answer of response.answers) {
      if (answer.scaleValue === null) continue

      const question = request.questions.find((q) => q.id === answer.questionId)
      if (!question) continue

      const category = question.category

      if (!peerAverages[category]) {
        peerAverages[category] = { total: 0, count: 0, average: 0 }
      }
      peerAverages[category].total += answer.scaleValue
      peerAverages[category].count += 1
      peerAverages[category].average = peerAverages[category].total / peerAverages[category].count
    }
  }

  // Build comparisons
  const comparisons = Object.keys(peerAverages).map((category) => {
    const selfAssessment = selfAssessments.find((sa) => sa.category === category)
    const selfRating = selfAssessment?.rating || null
    const peerAverage = peerAverages[category].average

    return {
      category,
      selfRating,
      peerAverage: Math.round(peerAverage * 10) / 10,
      gap: selfRating !== null ? Math.round((selfRating - peerAverage) * 10) / 10 : null,
      insight:
        selfRating !== null
          ? selfRating > peerAverage + 0.5
            ? 'overestimating'
            : selfRating < peerAverage - 0.5
            ? 'underestimating'
            : 'aligned'
          : 'no self-assessment',
    }
  })

  return {
    requestId,
    comparisons,
    summary: {
      overestimatedAreas: comparisons.filter((c) => c.insight === 'overestimating').length,
      underestimatedAreas: comparisons.filter((c) => c.insight === 'underestimating').length,
      alignedAreas: comparisons.filter((c) => c.insight === 'aligned').length,
    },
  }
}
