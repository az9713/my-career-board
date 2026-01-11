// Mock Prisma
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    bet: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    problem: {
      findMany: jest.fn(),
    },
    boardSession: {
      findMany: jest.fn(),
    },
    sessionMessage: {
      findMany: jest.fn(),
    },
  },
}))

import {
  calculateBetAccuracy,
  getBetAccuracyTrend,
  getTimeAllocationHistory,
  getAvoidancePatterns,
  getQuarterlyMetrics,
  formatQuarter,
} from '@/lib/analytics/service'
import prisma from '@/lib/prisma/client'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Analytics Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('calculateBetAccuracy', () => {
    it('should calculate accuracy percentage correctly', async () => {
      const userId = 'user-123'

      mockPrisma.bet.findMany.mockResolvedValue([
        { id: '1', outcome: 'hit', status: 'resolved' },
        { id: '2', outcome: 'hit', status: 'resolved' },
        { id: '3', outcome: 'miss', status: 'resolved' },
        { id: '4', outcome: 'hit', status: 'resolved' },
        { id: '5', status: 'pending' }, // Should be excluded
      ] as any)

      const result = await calculateBetAccuracy(userId)

      expect(result.accuracy).toBe(75) // 3 hits out of 4 resolved
      expect(result.total).toBe(4)
      expect(result.hits).toBe(3)
      expect(result.misses).toBe(1)
    })

    it('should return 0% with no resolved bets', async () => {
      const userId = 'user-123'

      mockPrisma.bet.findMany.mockResolvedValue([
        { id: '1', status: 'pending' },
        { id: '2', status: 'pending' },
      ] as any)

      const result = await calculateBetAccuracy(userId)

      expect(result.accuracy).toBe(0)
      expect(result.total).toBe(0)
    })

    it('should exclude excused bets from calculation', async () => {
      const userId = 'user-123'

      mockPrisma.bet.findMany.mockResolvedValue([
        { id: '1', outcome: 'hit', status: 'resolved' },
        { id: '2', outcome: 'excused', status: 'resolved' },
        { id: '3', outcome: 'miss', status: 'resolved' },
      ] as any)

      const result = await calculateBetAccuracy(userId)

      expect(result.accuracy).toBe(50) // 1 hit out of 2 (excluding excused)
      expect(result.total).toBe(2)
      expect(result.excused).toBe(1)
    })
  })

  describe('getBetAccuracyTrend', () => {
    it('should aggregate data by quarter', async () => {
      const userId = 'user-123'

      mockPrisma.bet.findMany.mockResolvedValue([
        { id: '1', quarter: 'Q1-2025', outcome: 'hit', status: 'resolved' },
        { id: '2', quarter: 'Q1-2025', outcome: 'miss', status: 'resolved' },
        { id: '3', quarter: 'Q2-2025', outcome: 'hit', status: 'resolved' },
        { id: '4', quarter: 'Q2-2025', outcome: 'hit', status: 'resolved' },
        { id: '5', quarter: 'Q3-2025', outcome: 'hit', status: 'resolved' },
      ] as any)

      const result = await getBetAccuracyTrend(userId)

      expect(result.length).toBeGreaterThanOrEqual(2)
      expect(result[0]).toHaveProperty('quarter')
      expect(result[0]).toHaveProperty('accuracy')
      expect(result[0]).toHaveProperty('total')
    })

    it('should calculate trend direction', async () => {
      const userId = 'user-123'

      mockPrisma.bet.findMany.mockResolvedValue([
        { id: '1', quarter: 'Q1-2025', outcome: 'miss', status: 'resolved' },
        { id: '2', quarter: 'Q2-2025', outcome: 'hit', status: 'resolved' },
        { id: '3', quarter: 'Q3-2025', outcome: 'hit', status: 'resolved' },
      ] as any)

      const result = await getBetAccuracyTrend(userId)

      // Should indicate improving trend
      expect(result[result.length - 1].accuracy).toBeGreaterThan(result[0].accuracy)
    })

    it('should handle empty dataset', async () => {
      const userId = 'user-123'

      mockPrisma.bet.findMany.mockResolvedValue([])

      const result = await getBetAccuracyTrend(userId)

      expect(result).toEqual([])
    })
  })

  describe('getTimeAllocationHistory', () => {
    it('should return allocation data for chart', async () => {
      const userId = 'user-123'

      mockPrisma.problem.findMany.mockResolvedValue([
        { id: '1', name: 'Problem A', timeAllocation: 40, createdAt: new Date('2025-01-01') },
        { id: '2', name: 'Problem B', timeAllocation: 30, createdAt: new Date('2025-01-01') },
        { id: '3', name: 'Problem C', timeAllocation: 30, createdAt: new Date('2025-01-01') },
      ] as any)

      const result = await getTimeAllocationHistory(userId)

      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('allocation')
    })

    it('should include all problems in portfolio', async () => {
      const userId = 'user-123'

      mockPrisma.problem.findMany.mockResolvedValue([
        { id: '1', name: 'Problem A', timeAllocation: 50 },
        { id: '2', name: 'Problem B', timeAllocation: 30 },
        { id: '3', name: 'Problem C', timeAllocation: 20 },
      ] as any)

      const result = await getTimeAllocationHistory(userId)

      expect(result.length).toBe(3)
      const totalAllocation = result.reduce((sum, p) => sum + p.allocation, 0)
      expect(totalAllocation).toBe(100)
    })
  })

  describe('getAvoidancePatterns', () => {
    it('should identify recurring avoidance themes', async () => {
      const userId = 'user-123'

      mockPrisma.sessionMessage.findMany.mockResolvedValue([
        { content: 'avoiding the salary conversation', createdAt: new Date() },
        { content: 'still avoiding compensation talk', createdAt: new Date() },
        { content: 'putting off the promotion discussion', createdAt: new Date() },
        { content: 'avoiding difficult feedback', createdAt: new Date() },
        { content: 'still avoiding that feedback', createdAt: new Date() },
      ] as any)

      const result = await getAvoidancePatterns(userId)

      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('theme')
      expect(result[0]).toHaveProperty('frequency')
    })

    it('should rank patterns by frequency', async () => {
      const userId = 'user-123'

      mockPrisma.sessionMessage.findMany.mockResolvedValue([
        { content: 'avoiding salary talk', createdAt: new Date() },
        { content: 'avoiding salary again', createdAt: new Date() },
        { content: 'avoiding salary still', createdAt: new Date() },
        { content: 'avoiding feedback', createdAt: new Date() },
      ] as any)

      const result = await getAvoidancePatterns(userId)

      if (result.length > 1) {
        expect(result[0].frequency).toBeGreaterThanOrEqual(result[1].frequency)
      }
    })
  })

  describe('getQuarterlyMetrics', () => {
    it('should return comprehensive metrics for a quarter', async () => {
      const userId = 'user-123'
      const quarter = 'Q1-2025'

      mockPrisma.bet.findMany.mockResolvedValue([
        { id: '1', quarter, outcome: 'hit', status: 'resolved' },
        { id: '2', quarter, outcome: 'miss', status: 'resolved' },
      ] as any)

      mockPrisma.boardSession.findMany.mockResolvedValue([
        { id: '1', status: 'completed' },
        { id: '2', status: 'completed' },
      ] as any)

      const result = await getQuarterlyMetrics(userId, quarter)

      expect(result).toHaveProperty('betAccuracy')
      expect(result).toHaveProperty('sessionsCompleted')
      expect(result).toHaveProperty('quarter')
    })
  })

  describe('formatQuarter', () => {
    it('should format date to quarter string', () => {
      expect(formatQuarter(new Date('2025-01-15'))).toBe('Q1-2025')
      expect(formatQuarter(new Date('2025-04-15'))).toBe('Q2-2025')
      expect(formatQuarter(new Date('2025-07-15'))).toBe('Q3-2025')
      expect(formatQuarter(new Date('2025-10-15'))).toBe('Q4-2025')
    })
  })
})
