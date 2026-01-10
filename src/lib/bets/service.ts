import { prisma } from '@/lib/prisma/client'

export interface CreateBetData {
  userId: string
  content: string
  falsifiableCriteria: string
  deadline: Date
  quarter: string
}

export interface ResolveBetData {
  outcome: 'hit' | 'miss' | 'excused'
  evidence?: string
  reflection?: string
}

export interface AccuracyStats {
  percentage: number
  total: number
  hits: number
  misses: number
  excused: number
}

export async function createBet(data: CreateBetData) {
  // Validate required fields
  if (!data.deadline) {
    throw new Error('Deadline is required')
  }

  if (!data.falsifiableCriteria || data.falsifiableCriteria.trim() === '') {
    throw new Error('Falsifiable criteria is required')
  }

  return prisma.bet.create({
    data: {
      userId: data.userId,
      content: data.content,
      falsifiableCriteria: data.falsifiableCriteria,
      deadline: new Date(data.deadline),
      quarter: data.quarter,
      status: 'pending',
    },
  })
}

export async function resolveBet(betId: string, data: ResolveBetData) {
  // Get the current bet
  const bet = await prisma.bet.findUnique({
    where: { id: betId },
  })

  if (!bet) {
    throw new Error('Bet not found')
  }

  if (bet.status === 'resolved') {
    throw new Error('Bet has already been resolved')
  }

  // Update the bet with resolution
  return prisma.bet.update({
    where: { id: betId },
    data: {
      status: 'resolved',
      outcome: data.outcome,
      evidence: data.evidence || null,
      reflection: data.reflection || null,
      resolvedAt: new Date(),
    },
  })
}

export async function calculateAccuracy(
  userId: string,
  quarter?: string
): Promise<AccuracyStats> {
  const whereClause: Record<string, unknown> = {
    userId,
    status: 'resolved',
  }

  if (quarter) {
    whereClause.quarter = quarter
  }

  const bets = await prisma.bet.findMany({
    where: whereClause,
  })

  // Count outcomes
  const hits = bets.filter((b) => b.outcome === 'hit').length
  const misses = bets.filter((b) => b.outcome === 'miss').length
  const excused = bets.filter((b) => b.outcome === 'excused').length

  // Calculate percentage (excluding excused bets)
  const countedBets = hits + misses
  const percentage = countedBets > 0 ? Math.round((hits / countedBets) * 100) : 0

  return {
    percentage,
    total: countedBets,
    hits,
    misses,
    excused,
  }
}

export async function getUserBets(userId: string) {
  return prisma.bet.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getBetById(betId: string) {
  return prisma.bet.findUnique({
    where: { id: betId },
  })
}

export async function getPendingBets(userId: string) {
  return prisma.bet.findMany({
    where: {
      userId,
      status: 'pending',
    },
    orderBy: { deadline: 'asc' },
  })
}

export async function getBetsByQuarter(userId: string, quarter: string) {
  return prisma.bet.findMany({
    where: {
      userId,
      quarter,
    },
    orderBy: { createdAt: 'desc' },
  })
}
