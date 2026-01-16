import prisma from '@/lib/prisma/client'

export interface CreateDecisionData {
  userId: string
  title: string
  description?: string
  context?: string
  options?: string[]
  prediction?: string
  confidence?: number
  category?: string
  revisitAt?: Date
}

export interface UpdateDecisionData {
  title?: string
  description?: string
  context?: string
  options?: string[]
  chosenOption?: string
  prediction?: string
  confidence?: number
  category?: string
  status?: string
  decidedAt?: Date
  revisitAt?: Date
}

export interface DecisionFilter {
  status?: string
  category?: string
}

export interface RecordOutcomeData {
  decisionId: string
  actualOutcome: string
  accuracy?: number
  lessonsLearned?: string
}

export interface DecisionAnalytics {
  totalDecisions: number
  averageAccuracy: number | null
  decisionsByStatus: Record<string, number>
  decisionsByCategory: Record<string, number>
  recentDecisions: any[]
}

/**
 * Create a new decision
 */
export async function createDecision(data: CreateDecisionData) {
  return prisma.decision.create({
    data: {
      userId: data.userId,
      title: data.title,
      description: data.description,
      context: data.context,
      options: data.options ? JSON.stringify(data.options) : null,
      prediction: data.prediction,
      confidence: data.confidence,
      category: data.category,
      revisitAt: data.revisitAt,
    },
  })
}

/**
 * Get decision by ID with outcome and tags
 */
export async function getDecisionById(id: string) {
  return prisma.decision.findUnique({
    where: { id },
    include: {
      outcome: true,
      tags: true,
    },
  })
}

/**
 * Get all decisions for a user
 */
export async function getUserDecisions(userId: string, filters: DecisionFilter = {}) {
  const where: any = { userId }

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.category) {
    where.category = filters.category
  }

  return prisma.decision.findMany({
    where,
    include: {
      outcome: true,
      tags: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Update a decision
 */
export async function updateDecision(id: string, data: UpdateDecisionData) {
  const updateData: any = { ...data }

  if (data.options) {
    updateData.options = JSON.stringify(data.options)
  }

  return prisma.decision.update({
    where: { id },
    data: updateData,
    include: {
      outcome: true,
      tags: true,
    },
  })
}

/**
 * Delete a decision
 */
export async function deleteDecision(id: string) {
  return prisma.decision.delete({
    where: { id },
  })
}

/**
 * Record the outcome of a decision
 */
export async function recordOutcome(data: RecordOutcomeData) {
  const outcome = await prisma.decisionOutcome.create({
    data: {
      decisionId: data.decisionId,
      actualOutcome: data.actualOutcome,
      accuracy: data.accuracy,
      lessonsLearned: data.lessonsLearned,
    },
  })

  // Update decision status to closed
  await prisma.decision.update({
    where: { id: data.decisionId },
    data: { status: 'closed' },
  })

  return outcome
}

/**
 * Get decisions that are due for review
 */
export async function getDecisionsDueForReview(userId: string) {
  const now = new Date()

  return prisma.decision.findMany({
    where: {
      userId,
      status: { in: ['decided', 'reviewing'] },
      revisitAt: { lte: now },
    },
    include: {
      outcome: true,
      tags: true,
    },
    orderBy: { revisitAt: 'asc' },
  })
}

/**
 * Get decision analytics for a user
 */
export async function getDecisionAnalytics(userId: string): Promise<DecisionAnalytics> {
  const decisions = await prisma.decision.findMany({
    where: { userId },
    include: { outcome: true },
    orderBy: { createdAt: 'desc' },
  })

  const totalDecisions = await prisma.decision.count({
    where: { userId },
  })

  // Calculate average accuracy from closed decisions with outcomes
  const decisionsWithAccuracy = decisions.filter(
    (d) => d.outcome?.accuracy !== null && d.outcome?.accuracy !== undefined
  )
  const averageAccuracy =
    decisionsWithAccuracy.length > 0
      ? decisionsWithAccuracy.reduce((sum, d) => sum + (d.outcome?.accuracy || 0), 0) /
        decisionsWithAccuracy.length
      : null

  // Group by status
  const decisionsByStatus: Record<string, number> = {}
  for (const decision of decisions) {
    decisionsByStatus[decision.status] = (decisionsByStatus[decision.status] || 0) + 1
  }

  // Group by category
  const decisionsByCategory: Record<string, number> = {}
  for (const decision of decisions) {
    if (decision.category) {
      decisionsByCategory[decision.category] =
        (decisionsByCategory[decision.category] || 0) + 1
    }
  }

  return {
    totalDecisions,
    averageAccuracy,
    decisionsByStatus,
    decisionsByCategory,
    recentDecisions: decisions.slice(0, 5),
  }
}

/**
 * Add tags to a decision
 */
export async function addTags(decisionId: string, tags: string[]) {
  return prisma.decisionTag.createMany({
    data: tags.map((tag) => ({
      decisionId,
      tag,
    })),
    skipDuplicates: true,
  })
}

/**
 * Remove tags from a decision
 */
export async function removeTags(decisionId: string, tags: string[]) {
  return prisma.decisionTag.deleteMany({
    where: {
      decisionId,
      tag: { in: tags },
    },
  })
}
