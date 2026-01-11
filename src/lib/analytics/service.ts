import prisma from '@/lib/prisma/client'

export interface BetAccuracyResult {
  accuracy: number
  total: number
  hits: number
  misses: number
  excused: number
}

export interface QuarterlyBetData {
  quarter: string
  accuracy: number
  total: number
  hits: number
  misses: number
}

export interface TimeAllocationData {
  name: string
  allocation: number
  color?: string
}

export interface AvoidancePattern {
  theme: string
  frequency: number
  lastMentioned?: string
}

export interface QuarterlyMetrics {
  quarter: string
  betAccuracy: number
  sessionsCompleted: number
  betsTotal: number
}

/**
 * Format a date to quarter string (e.g., Q1-2025)
 */
export function formatQuarter(date: Date): string {
  const month = date.getMonth()
  const year = date.getFullYear()
  const quarter = Math.floor(month / 3) + 1
  return `Q${quarter}-${year}`
}

/**
 * Calculate overall bet accuracy for a user
 */
export async function calculateBetAccuracy(userId: string): Promise<BetAccuracyResult> {
  const bets = await prisma.bet.findMany({
    where: {
      userId,
      status: 'resolved',
    },
    select: {
      outcome: true,
    },
  })

  const hits = bets.filter(b => b.outcome === 'hit').length
  const misses = bets.filter(b => b.outcome === 'miss').length
  const excused = bets.filter(b => b.outcome === 'excused').length

  // Exclude excused from accuracy calculation
  const countedBets = hits + misses
  const accuracy = countedBets > 0 ? Math.round((hits / countedBets) * 100) : 0

  return {
    accuracy,
    total: countedBets,
    hits,
    misses,
    excused,
  }
}

/**
 * Get bet accuracy trend over quarters
 */
export async function getBetAccuracyTrend(userId: string): Promise<QuarterlyBetData[]> {
  const bets = await prisma.bet.findMany({
    where: {
      userId,
      status: 'resolved',
    },
    select: {
      quarter: true,
      outcome: true,
    },
    orderBy: {
      quarter: 'asc',
    },
  })

  if (bets.length === 0) {
    return []
  }

  // Group by quarter
  const quarterMap = new Map<string, { hits: number; misses: number }>()

  for (const bet of bets) {
    if (!bet.quarter || bet.outcome === 'excused') continue

    if (!quarterMap.has(bet.quarter)) {
      quarterMap.set(bet.quarter, { hits: 0, misses: 0 })
    }

    const stats = quarterMap.get(bet.quarter)!
    if (bet.outcome === 'hit') {
      stats.hits++
    } else if (bet.outcome === 'miss') {
      stats.misses++
    }
  }

  // Convert to array and calculate accuracy
  const result: QuarterlyBetData[] = []

  for (const [quarter, stats] of quarterMap) {
    const total = stats.hits + stats.misses
    const accuracy = total > 0 ? Math.round((stats.hits / total) * 100) : 0

    result.push({
      quarter,
      accuracy,
      total,
      hits: stats.hits,
      misses: stats.misses,
    })
  }

  // Sort by quarter
  return result.sort((a, b) => a.quarter.localeCompare(b.quarter))
}

/**
 * Get time allocation data for problems
 */
export async function getTimeAllocationHistory(userId: string): Promise<TimeAllocationData[]> {
  const problems = await prisma.problem.findMany({
    where: { userId },
    select: {
      name: true,
      timeAllocation: true,
    },
    orderBy: {
      timeAllocation: 'desc',
    },
  })

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return problems.map((p, i) => ({
    name: p.name,
    allocation: p.timeAllocation || 0,
    color: colors[i % colors.length],
  }))
}

/**
 * Detect avoidance patterns from session messages
 */
export async function getAvoidancePatterns(userId: string): Promise<AvoidancePattern[]> {
  const messages = await prisma.sessionMessage.findMany({
    where: {
      session: {
        userId,
      },
      speaker: 'user',
    },
    select: {
      content: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 200,
  })

  // Common avoidance-related words to track
  const avoidanceKeywords = [
    'salary', 'compensation', 'raise', 'promotion',
    'feedback', 'difficult', 'conversation',
    'manager', 'boss', 'confrontation',
    'deadline', 'project', 'decision',
  ]

  // Count keyword occurrences in avoidance contexts
  const keywordCounts = new Map<string, { count: number; lastMentioned: Date }>()

  for (const msg of messages) {
    const content = msg.content.toLowerCase()

    // Only count if in avoidance context
    const hasAvoidanceContext =
      content.includes('avoid') ||
      content.includes('putting off') ||
      content.includes('should have') ||
      content.includes('been meaning') ||
      content.includes('procrastinat')

    if (!hasAvoidanceContext) continue

    for (const keyword of avoidanceKeywords) {
      if (content.includes(keyword)) {
        const existing = keywordCounts.get(keyword)
        if (!existing) {
          keywordCounts.set(keyword, { count: 1, lastMentioned: msg.createdAt })
        } else {
          existing.count++
        }
      }
    }
  }

  // Convert to array and sort by frequency
  const patterns: AvoidancePattern[] = []

  for (const [theme, data] of keywordCounts) {
    if (data.count >= 2) {
      patterns.push({
        theme,
        frequency: data.count,
        lastMentioned: data.lastMentioned.toISOString().split('T')[0],
      })
    }
  }

  return patterns.sort((a, b) => b.frequency - a.frequency)
}

/**
 * Get comprehensive metrics for a specific quarter
 */
export async function getQuarterlyMetrics(
  userId: string,
  quarter: string
): Promise<QuarterlyMetrics> {
  // Get bets for this quarter
  const bets = await prisma.bet.findMany({
    where: {
      userId,
      quarter,
      status: 'resolved',
    },
    select: {
      outcome: true,
    },
  })

  const hits = bets.filter(b => b.outcome === 'hit').length
  const misses = bets.filter(b => b.outcome === 'miss').length
  const total = hits + misses
  const accuracy = total > 0 ? Math.round((hits / total) * 100) : 0

  // Get sessions completed in this quarter
  const [year, q] = quarter.split('-')
  const quarterNum = parseInt(q.replace('Q', ''))
  const startMonth = (quarterNum - 1) * 3
  const startDate = new Date(parseInt(year), startMonth, 1)
  const endDate = new Date(parseInt(year), startMonth + 3, 0)

  const sessions = await prisma.boardSession.findMany({
    where: {
      userId,
      status: 'completed',
      startedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  })

  return {
    quarter,
    betAccuracy: accuracy,
    sessionsCompleted: sessions.length,
    betsTotal: total,
  }
}
