/**
 * @jest-environment node
 */

import {
  generateQuarterlyReportData,
  generateBetHistoryData,
  generateSessionTranscript,
  formatReportAsMarkdown,
  formatReportAsCSV,
  formatReportAsJSON,
  ExportFormat,
} from '@/lib/export/service'

// Mock Prisma
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    boardSession: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    sessionMessage: {
      findMany: jest.fn(),
    },
    bet: {
      findMany: jest.fn(),
    },
    quarterlyReport: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    problem: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))

describe('Export Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateQuarterlyReportData', () => {
    it('should generate report data for a quarter', async () => {
      const { default: prisma } = require('@/lib/prisma/client')

      prisma.quarterlyReport.findMany.mockResolvedValue([
        {
          id: 'report-1',
          quarter: 'Q1-2025',
          nextBet: 'Ship new feature',
          nextBetWrongIf: 'No user adoption',
          avoidedDecision: 'Salary negotiation',
          createdAt: new Date('2025-01-15'),
        },
      ])

      prisma.bet.findMany.mockResolvedValue([
        { id: 'bet-1', content: 'Test bet', outcome: 'hit', quarter: 'Q1-2025' },
      ])

      const data = await generateQuarterlyReportData('user-123', 'Q1-2025')

      expect(data).toBeDefined()
      expect(data.quarter).toBe('Q1-2025')
      expect(data.reports).toHaveLength(1)
      expect(data.bets).toHaveLength(1)
    })

    it('should include bet accuracy statistics', async () => {
      const { default: prisma } = require('@/lib/prisma/client')

      prisma.quarterlyReport.findMany.mockResolvedValue([])
      prisma.bet.findMany.mockResolvedValue([
        { id: 'bet-1', outcome: 'hit', quarter: 'Q1-2025' },
        { id: 'bet-2', outcome: 'hit', quarter: 'Q1-2025' },
        { id: 'bet-3', outcome: 'miss', quarter: 'Q1-2025' },
      ])

      const data = await generateQuarterlyReportData('user-123', 'Q1-2025')

      expect(data.stats.totalBets).toBe(3)
      expect(data.stats.hits).toBe(2)
      expect(data.stats.misses).toBe(1)
      expect(data.stats.accuracy).toBeCloseTo(66.67, 1)
    })

    it('should handle empty quarter', async () => {
      const { default: prisma } = require('@/lib/prisma/client')

      prisma.quarterlyReport.findMany.mockResolvedValue([])
      prisma.bet.findMany.mockResolvedValue([])

      const data = await generateQuarterlyReportData('user-123', 'Q1-2025')

      expect(data.reports).toHaveLength(0)
      expect(data.bets).toHaveLength(0)
      expect(data.stats.accuracy).toBe(0)
    })
  })

  describe('generateBetHistoryData', () => {
    it('should generate complete bet history', async () => {
      const { default: prisma } = require('@/lib/prisma/client')

      prisma.bet.findMany.mockResolvedValue([
        {
          id: 'bet-1',
          content: 'Ship feature X',
          falsifiableCriteria: '100 users adopt',
          deadline: new Date('2025-03-31'),
          quarter: 'Q1-2025',
          status: 'resolved',
          outcome: 'hit',
          evidence: 'Shipped and 150 users adopted',
          createdAt: new Date('2025-01-01'),
          resolvedAt: new Date('2025-03-15'),
        },
        {
          id: 'bet-2',
          content: 'Learn Rust',
          falsifiableCriteria: 'Build a CLI tool',
          deadline: new Date('2025-06-30'),
          quarter: 'Q2-2025',
          status: 'pending',
          outcome: null,
          createdAt: new Date('2025-04-01'),
        },
      ])

      const data = await generateBetHistoryData('user-123')

      expect(data.bets).toHaveLength(2)
      expect(data.summary.total).toBe(2)
      expect(data.summary.resolved).toBe(1)
      expect(data.summary.pending).toBe(1)
    })

    it('should group bets by quarter', async () => {
      const { default: prisma } = require('@/lib/prisma/client')

      prisma.bet.findMany.mockResolvedValue([
        { id: 'bet-1', quarter: 'Q1-2025', outcome: 'hit' },
        { id: 'bet-2', quarter: 'Q1-2025', outcome: 'miss' },
        { id: 'bet-3', quarter: 'Q2-2025', outcome: 'hit' },
      ])

      const data = await generateBetHistoryData('user-123')

      expect(data.byQuarter['Q1-2025']).toHaveLength(2)
      expect(data.byQuarter['Q2-2025']).toHaveLength(1)
    })

    it('should calculate overall accuracy', async () => {
      const { default: prisma } = require('@/lib/prisma/client')

      prisma.bet.findMany.mockResolvedValue([
        { id: 'bet-1', outcome: 'hit', status: 'resolved' },
        { id: 'bet-2', outcome: 'hit', status: 'resolved' },
        { id: 'bet-3', outcome: 'miss', status: 'resolved' },
        { id: 'bet-4', outcome: null, status: 'pending' },
      ])

      const data = await generateBetHistoryData('user-123')

      expect(data.summary.accuracy).toBeCloseTo(66.67, 1)
    })
  })

  describe('generateSessionTranscript', () => {
    it('should generate session transcript with messages', async () => {
      const { default: prisma } = require('@/lib/prisma/client')

      prisma.boardSession.findUnique.mockResolvedValue({
        id: 'session-1',
        userId: 'user-123',
        sessionType: 'quarterly_review',
        quarter: 'Q1-2025',
        startedAt: new Date('2025-01-15T10:00:00'),
        completedAt: new Date('2025-01-15T11:30:00'),
      })

      prisma.sessionMessage.findMany.mockResolvedValue([
        {
          id: 'msg-1',
          speaker: 'user',
          content: 'I want to discuss my progress',
          createdAt: new Date('2025-01-15T10:05:00'),
        },
        {
          id: 'msg-2',
          speaker: 'accountability_hawk',
          content: 'Let\'s review your commitments',
          createdAt: new Date('2025-01-15T10:06:00'),
        },
      ])

      const transcript = await generateSessionTranscript('user-123', 'session-1')

      expect(transcript.session).toBeDefined()
      expect(transcript.messages).toHaveLength(2)
      expect(transcript.messages[0].speaker).toBe('user')
      expect(transcript.messages[1].speaker).toBe('accountability_hawk')
    })

    it('should include session metadata', async () => {
      const { default: prisma } = require('@/lib/prisma/client')

      prisma.boardSession.findUnique.mockResolvedValue({
        id: 'session-1',
        userId: 'user-123',
        sessionType: 'quarterly_review',
        quarter: 'Q1-2025',
        currentPhase: 6,
        status: 'completed',
        startedAt: new Date('2025-01-15T10:00:00'),
        completedAt: new Date('2025-01-15T11:30:00'),
      })

      prisma.sessionMessage.findMany.mockResolvedValue([])

      const transcript = await generateSessionTranscript('user-123', 'session-1')

      expect(transcript.session.sessionType).toBe('quarterly_review')
      expect(transcript.session.quarter).toBe('Q1-2025')
      expect(transcript.duration).toBeDefined()
    })

    it('should return null for non-existent session', async () => {
      const { default: prisma } = require('@/lib/prisma/client')
      prisma.boardSession.findUnique.mockResolvedValue(null)

      const transcript = await generateSessionTranscript('user-123', 'invalid')

      expect(transcript).toBeNull()
    })
  })

  describe('formatReportAsMarkdown', () => {
    it('should format quarterly report as markdown', () => {
      const data = {
        quarter: 'Q1-2025',
        generatedAt: new Date('2025-01-20'),
        reports: [
          {
            nextBet: 'Ship feature',
            avoidedDecision: 'Salary talk',
          },
        ],
        bets: [
          { content: 'Test bet', outcome: 'hit' },
        ],
        stats: { totalBets: 1, hits: 1, misses: 0, accuracy: 100 },
      }

      const markdown = formatReportAsMarkdown(data)

      expect(markdown).toContain('# Quarterly Report: Q1-2025')
      expect(markdown).toContain('Ship feature')
      expect(markdown).toContain('Test bet')
      expect(markdown).toContain('100%')
    })

    it('should include all sections', () => {
      const data = {
        quarter: 'Q1-2025',
        generatedAt: new Date(),
        reports: [],
        bets: [],
        stats: { totalBets: 0, hits: 0, misses: 0, accuracy: 0 },
      }

      const markdown = formatReportAsMarkdown(data)

      expect(markdown).toContain('## Summary')
      expect(markdown).toContain('## Bets')
      expect(markdown).toContain('## Statistics')
    })
  })

  describe('formatReportAsCSV', () => {
    it('should format bet history as CSV', () => {
      const data = {
        bets: [
          {
            content: 'Ship feature',
            quarter: 'Q1-2025',
            outcome: 'hit',
            deadline: '2025-03-31',
          },
          {
            content: 'Learn Rust',
            quarter: 'Q2-2025',
            outcome: 'pending',
            deadline: '2025-06-30',
          },
        ],
      }

      const csv = formatReportAsCSV(data.bets)

      expect(csv).toContain('content,quarter,outcome,deadline')
      expect(csv).toContain('Ship feature')
      expect(csv).toContain('Learn Rust')
    })

    it('should escape commas in content', () => {
      const data = {
        bets: [
          { content: 'Ship feature, with commas', quarter: 'Q1-2025', outcome: 'hit' },
        ],
      }

      const csv = formatReportAsCSV(data.bets)

      expect(csv).toContain('"Ship feature, with commas"')
    })

    it('should handle empty data', () => {
      const csv = formatReportAsCSV([])

      expect(csv).toContain('content,quarter,outcome,deadline')
      expect(csv.split('\n').length).toBe(1) // Just header
    })
  })

  describe('formatReportAsJSON', () => {
    it('should format data as JSON', () => {
      const data = {
        quarter: 'Q1-2025',
        bets: [{ content: 'Test', outcome: 'hit' }],
      }

      const json = formatReportAsJSON(data)
      const parsed = JSON.parse(json)

      expect(parsed.quarter).toBe('Q1-2025')
      expect(parsed.bets).toHaveLength(1)
    })

    it('should include metadata', () => {
      const data = { test: 'data' }

      const json = formatReportAsJSON(data)
      const parsed = JSON.parse(json)

      expect(parsed.exportedAt).toBeDefined()
      expect(parsed.version).toBeDefined()
    })
  })
})
