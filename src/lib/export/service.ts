import prisma from '@/lib/prisma/client'

export type ExportFormat = 'markdown' | 'json' | 'csv'

export interface QuarterlyReportData {
  quarter: string
  generatedAt: Date
  reports: Array<{
    id: string
    nextBet?: string | null
    nextBetWrongIf?: string | null
    avoidedDecision: string
    avoidedDecisionWhy: string
    createdAt: Date
  }>
  bets: Array<{
    id: string
    content: string
    falsifiableCriteria: string
    outcome: string | null
    evidence?: string | null
    deadline: Date
  }>
  stats: {
    totalBets: number
    hits: number
    misses: number
    accuracy: number
  }
}

export interface BetHistoryData {
  bets: Array<{
    id: string
    content: string
    falsifiableCriteria: string
    quarter: string
    status: string
    outcome: string | null
    evidence?: string | null
    deadline: Date
    createdAt: Date
    resolvedAt?: Date | null
  }>
  byQuarter: Record<string, Array<{ id: string; outcome: string | null }>>
  summary: {
    total: number
    resolved: number
    pending: number
    accuracy: number
  }
}

export interface SessionTranscript {
  session: {
    id: string
    sessionType: string
    quarter?: string | null
    currentPhase: number
    status: string
    startedAt: Date
    completedAt?: Date | null
  }
  messages: Array<{
    id: string
    speaker: string
    content: string
    createdAt: Date
  }>
  duration: number
}

export interface BetHistoryFilters {
  quarter?: string
  status?: string
}

/**
 * Generate quarterly report data
 */
export async function generateQuarterlyReportData(
  userId: string,
  quarter: string
): Promise<QuarterlyReportData> {
  const [reports, bets] = await Promise.all([
    prisma.quarterlyReport.findMany({
      where: { userId, quarter },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.bet.findMany({
      where: { userId, quarter },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const hits = bets.filter((b) => b.outcome === 'hit').length
  const misses = bets.filter((b) => b.outcome === 'miss').length
  const resolved = hits + misses
  const accuracy = resolved > 0 ? (hits / resolved) * 100 : 0

  return {
    quarter,
    generatedAt: new Date(),
    reports: reports.map((r) => ({
      id: r.id,
      nextBet: r.nextBet,
      nextBetWrongIf: r.nextBetWrongIf,
      avoidedDecision: r.avoidedDecision,
      avoidedDecisionWhy: r.avoidedDecisionWhy,
      createdAt: r.createdAt,
    })),
    bets: bets.map((b) => ({
      id: b.id,
      content: b.content,
      falsifiableCriteria: b.falsifiableCriteria,
      outcome: b.outcome,
      evidence: b.evidence,
      deadline: b.deadline,
    })),
    stats: {
      totalBets: bets.length,
      hits,
      misses,
      accuracy: Math.round(accuracy * 100) / 100,
    },
  }
}

/**
 * Generate bet history data
 */
export async function generateBetHistoryData(
  userId: string,
  filters?: BetHistoryFilters
): Promise<BetHistoryData> {
  const where: Record<string, unknown> = { userId }

  if (filters?.quarter) {
    where.quarter = filters.quarter
  }
  if (filters?.status) {
    where.status = filters.status
  }

  const bets = await prisma.bet.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  const byQuarter: Record<string, Array<{ id: string; outcome: string | null }>> = {}
  for (const bet of bets) {
    if (!byQuarter[bet.quarter]) {
      byQuarter[bet.quarter] = []
    }
    byQuarter[bet.quarter].push({ id: bet.id, outcome: bet.outcome })
  }

  const resolved = bets.filter((b) => b.status === 'resolved').length
  const pending = bets.filter((b) => b.status === 'pending').length
  const hits = bets.filter((b) => b.outcome === 'hit').length
  const accuracy = resolved > 0 ? (hits / resolved) * 100 : 0

  return {
    bets: bets.map((b) => ({
      id: b.id,
      content: b.content,
      falsifiableCriteria: b.falsifiableCriteria,
      quarter: b.quarter,
      status: b.status,
      outcome: b.outcome,
      evidence: b.evidence,
      deadline: b.deadline,
      createdAt: b.createdAt,
      resolvedAt: b.resolvedAt,
    })),
    byQuarter,
    summary: {
      total: bets.length,
      resolved,
      pending,
      accuracy: Math.round(accuracy * 100) / 100,
    },
  }
}

/**
 * Generate session transcript
 */
export async function generateSessionTranscript(
  userId: string,
  sessionId: string
): Promise<SessionTranscript | null> {
  const session = await prisma.boardSession.findUnique({
    where: { id: sessionId },
  })

  if (!session || session.userId !== userId) {
    return null
  }

  const messages = await prisma.sessionMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  })

  const startTime = session.startedAt.getTime()
  const endTime = session.completedAt?.getTime() || Date.now()
  const duration = Math.round((endTime - startTime) / 60000) // minutes

  return {
    session: {
      id: session.id,
      sessionType: session.sessionType,
      quarter: session.quarter,
      currentPhase: session.currentPhase,
      status: session.status,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
    },
    messages: messages.map((m) => ({
      id: m.id,
      speaker: m.speaker,
      content: m.content,
      createdAt: m.createdAt,
    })),
    duration,
  }
}

/**
 * Format report as Markdown
 */
export function formatReportAsMarkdown(data: QuarterlyReportData): string {
  const lines: string[] = []

  lines.push(`# Quarterly Report: ${data.quarter}`)
  lines.push('')
  lines.push(`Generated: ${data.generatedAt.toLocaleDateString()}`)
  lines.push('')

  lines.push('## Summary')
  lines.push('')
  if (data.reports.length > 0) {
    for (const report of data.reports) {
      if (report.nextBet) {
        lines.push(`**Next Bet:** ${report.nextBet}`)
      }
      if (report.avoidedDecision) {
        lines.push(`**Avoided Decision:** ${report.avoidedDecision}`)
      }
      lines.push('')
    }
  } else {
    lines.push('No reports for this quarter.')
    lines.push('')
  }

  lines.push('## Bets')
  lines.push('')
  if (data.bets.length > 0) {
    for (const bet of data.bets) {
      const status = bet.outcome ? `[${bet.outcome.toUpperCase()}]` : '[PENDING]'
      lines.push(`- ${status} ${bet.content}`)
    }
  } else {
    lines.push('No bets for this quarter.')
  }
  lines.push('')

  lines.push('## Statistics')
  lines.push('')
  lines.push(`- Total Bets: ${data.stats.totalBets}`)
  lines.push(`- Hits: ${data.stats.hits}`)
  lines.push(`- Misses: ${data.stats.misses}`)
  lines.push(`- Accuracy: ${data.stats.accuracy}%`)

  return lines.join('\n')
}

/**
 * Format session transcript as Markdown
 */
export function formatTranscriptAsMarkdown(data: SessionTranscript): string {
  const lines: string[] = []

  lines.push(`# Board Session Transcript`)
  lines.push('')
  lines.push(`**Type:** ${data.session.sessionType}`)
  if (data.session.quarter) {
    lines.push(`**Quarter:** ${data.session.quarter}`)
  }
  lines.push(`**Date:** ${data.session.startedAt.toLocaleDateString()}`)
  lines.push(`**Duration:** ${data.duration} minutes`)
  lines.push(`**Status:** ${data.session.status}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  for (const msg of data.messages) {
    const speaker = msg.speaker === 'user' ? 'You' : formatSpeakerName(msg.speaker)
    const time = msg.createdAt.toLocaleTimeString()
    lines.push(`### ${speaker} (${time})`)
    lines.push('')
    lines.push(msg.content)
    lines.push('')
  }

  return lines.join('\n')
}

function formatSpeakerName(speaker: string): string {
  return speaker
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Format data as CSV
 */
export function formatReportAsCSV(
  bets: Array<{
    content: string
    quarter?: string
    outcome?: string | null
    deadline?: string | Date
  }>
): string {
  const headers = ['content', 'quarter', 'outcome', 'deadline']
  const lines: string[] = [headers.join(',')]

  for (const bet of bets) {
    const row = [
      escapeCSV(bet.content),
      bet.quarter || '',
      bet.outcome || 'pending',
      bet.deadline instanceof Date
        ? bet.deadline.toISOString().split('T')[0]
        : bet.deadline || '',
    ]
    lines.push(row.join(','))
  }

  return lines.join('\n')
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Format data as JSON
 */
export function formatReportAsJSON(data: unknown): string {
  return JSON.stringify(
    {
      ...data as Record<string, unknown>,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    },
    null,
    2
  )
}
