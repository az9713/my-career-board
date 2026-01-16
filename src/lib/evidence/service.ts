import prisma from '@/lib/prisma/client'

export type EvidenceType = 'win' | 'feedback' | 'metric' | 'artifact' | 'milestone'
export type EvidenceSource = 'performance-review' | 'self' | 'manager' | 'peer' | 'customer'

export interface CreateEvidenceData {
  userId: string
  title: string
  description?: string
  type: string
  source?: string
  date?: Date
  impact?: string
  metadata?: string
}

export interface EvidenceFilter {
  type?: string
  source?: string
  startDate?: Date
  endDate?: Date
}

export interface EvidenceSummaryOptions {
  startDate?: Date
  endDate?: Date
}

export interface EvidenceSummary {
  totalCount: number
  byType: Record<string, number>
  bySource: Record<string, number>
  recentEvidence: any[]
}

/**
 * Create new evidence entry
 */
export async function createEvidence(data: CreateEvidenceData) {
  return prisma.evidence.create({
    data,
  })
}

/**
 * Get evidence by ID with attachments and problem links
 */
export async function getEvidenceById(id: string) {
  return prisma.evidence.findUnique({
    where: { id },
    include: {
      attachments: true,
      problemLinks: true,
    },
  })
}

/**
 * Get all evidence for a user with optional filters
 */
export async function getUserEvidence(userId: string, filters: EvidenceFilter = {}) {
  const where: any = { userId }

  if (filters.type) {
    where.type = filters.type
  }

  if (filters.source) {
    where.source = filters.source
  }

  if (filters.startDate || filters.endDate) {
    where.date = {}
    if (filters.startDate) {
      where.date.gte = filters.startDate
    }
    if (filters.endDate) {
      where.date.lte = filters.endDate
    }
  }

  return prisma.evidence.findMany({
    where,
    include: {
      attachments: true,
      problemLinks: true,
    },
    orderBy: { date: 'desc' },
  })
}

/**
 * Update evidence
 */
export async function updateEvidence(id: string, data: Partial<CreateEvidenceData>) {
  return prisma.evidence.update({
    where: { id },
    data,
  })
}

/**
 * Delete evidence
 */
export async function deleteEvidence(id: string) {
  return prisma.evidence.delete({
    where: { id },
  })
}

/**
 * Link evidence to a problem in the portfolio
 */
export async function linkEvidenceToProblem(evidenceId: string, problemId: string) {
  return prisma.evidenceProblemLink.create({
    data: {
      evidenceId,
      problemId,
    },
  })
}

/**
 * Unlink evidence from a problem
 */
export async function unlinkEvidenceFromProblem(evidenceId: string, problemId: string) {
  return prisma.evidenceProblemLink.delete({
    where: {
      evidenceId_problemId: {
        evidenceId,
        problemId,
      },
    },
  })
}

/**
 * Get all evidence linked to a specific problem
 */
export async function getEvidenceByProblem(problemId: string) {
  const links = await prisma.evidenceProblemLink.findMany({
    where: { problemId },
  })

  const evidenceIds = links.map((link) => link.evidenceId)

  return prisma.evidence.findMany({
    where: {
      id: { in: evidenceIds },
    },
    include: {
      attachments: true,
      problemLinks: true,
    },
    orderBy: { date: 'desc' },
  })
}

/**
 * Generate a summary of user's evidence
 */
export async function getEvidenceSummary(
  userId: string,
  options: EvidenceSummaryOptions = {}
): Promise<EvidenceSummary> {
  const where: any = { userId }

  if (options.startDate || options.endDate) {
    where.date = {}
    if (options.startDate) {
      where.date.gte = options.startDate
    }
    if (options.endDate) {
      where.date.lte = options.endDate
    }
  }

  const evidence = await prisma.evidence.findMany({
    where,
    orderBy: { date: 'desc' },
  })

  const totalCount = await prisma.evidence.count({ where })

  // Group by type
  const byType: Record<string, number> = {}
  const bySource: Record<string, number> = {}

  for (const item of evidence) {
    byType[item.type] = (byType[item.type] || 0) + 1
    if (item.source) {
      bySource[item.source] = (bySource[item.source] || 0) + 1
    }
  }

  // Get recent evidence (top 5)
  const recentEvidence = evidence.slice(0, 5)

  return {
    totalCount,
    byType,
    bySource,
    recentEvidence,
  }
}

/**
 * Search evidence by keyword in title, description, or impact
 */
export async function searchEvidence(userId: string, keyword: string) {
  return prisma.evidence.findMany({
    where: {
      userId,
      OR: [
        { title: { contains: keyword } },
        { description: { contains: keyword } },
        { impact: { contains: keyword } },
      ],
    },
    include: {
      attachments: true,
      problemLinks: true,
    },
    orderBy: { date: 'desc' },
  })
}
