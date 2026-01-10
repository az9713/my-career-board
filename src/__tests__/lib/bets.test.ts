// Mock Prisma client - define mocks inline to avoid hoisting issues
jest.mock('@/lib/prisma/client', () => ({
  prisma: {
    bet: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}))

import {
  createBet,
  resolveBet,
  calculateAccuracy,
  getUserBets,
  getBetById,
} from '@/lib/bets/service'
import { prisma } from '@/lib/prisma/client'

// Get typed mock
const mockPrisma = prisma as jest.Mocked<typeof prisma>

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
})

describe('Bet Service', () => {
  const mockUserId = 'user-123'
  const mockBetId = 'bet-456'

  describe('createBet', () => {
    it('should create a bet with required fields', async () => {
      const betData = {
        userId: mockUserId,
        content: 'I will ship the new feature by end of Q1',
        falsifiableCriteria: 'Feature is deployed to production with tests passing',
        deadline: new Date('2024-03-31'),
        quarter: 'Q1-2024',
      }

      const expectedBet = {
        id: mockBetId,
        ...betData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        resolvedAt: null,
        outcome: null,
        reflection: null,
        evidence: null,
      }

      ;(mockPrisma.bet.create as jest.Mock).mockResolvedValue(expectedBet)

      const result = await createBet(betData)

      expect(result).toEqual(expectedBet)
      expect(mockPrisma.bet.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          content: betData.content,
          falsifiableCriteria: betData.falsifiableCriteria,
          status: 'pending',
        }),
      })
    })

    it('should set default status to pending', async () => {
      const betData = {
        userId: mockUserId,
        content: 'Test bet',
        falsifiableCriteria: 'Test criteria',
        deadline: new Date('2024-03-31'),
        quarter: 'Q1-2024',
      }

      ;(mockPrisma.bet.create as jest.Mock).mockResolvedValue({
        id: mockBetId,
        ...betData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        resolvedAt: null,
        outcome: null,
        reflection: null,
        evidence: null,
      })

      const result = await createBet(betData)

      expect(result.status).toBe('pending')
    })

    it('should require a deadline date', async () => {
      const betData = {
        userId: mockUserId,
        content: 'Test bet',
        falsifiableCriteria: 'Test criteria',
        deadline: null as unknown as Date,
        quarter: 'Q1-2024',
      }

      await expect(createBet(betData)).rejects.toThrow('Deadline is required')
    })

    it('should reject bets without falsifiable criteria', async () => {
      const betData = {
        userId: mockUserId,
        content: 'Test bet',
        falsifiableCriteria: '',
        deadline: new Date('2024-03-31'),
        quarter: 'Q1-2024',
      }

      await expect(createBet(betData)).rejects.toThrow(
        'Falsifiable criteria is required'
      )
    })
  })

  describe('resolveBet', () => {
    const pendingBet = {
      id: mockBetId,
      userId: mockUserId,
      content: 'Test bet',
      falsifiableCriteria: 'Test criteria',
      deadline: new Date('2024-03-31'),
      quarter: 'Q1-2024',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null,
      outcome: null,
      reflection: null,
      evidence: null,
    }

    it('should mark bet as hit with evidence', async () => {
      ;(mockPrisma.bet.findUnique as jest.Mock).mockResolvedValue(pendingBet)
      ;(mockPrisma.bet.update as jest.Mock).mockResolvedValue({
        ...pendingBet,
        status: 'resolved',
        outcome: 'hit',
        evidence: 'Shipped on March 15th, PR #123',
        resolvedAt: new Date(),
      })

      const result = await resolveBet(mockBetId, {
        outcome: 'hit',
        evidence: 'Shipped on March 15th, PR #123',
      })

      expect(result.outcome).toBe('hit')
      expect(result.status).toBe('resolved')
      expect(result.evidence).toBe('Shipped on March 15th, PR #123')
    })

    it('should mark bet as miss with reflection', async () => {
      ;(mockPrisma.bet.findUnique as jest.Mock).mockResolvedValue(pendingBet)
      ;(mockPrisma.bet.update as jest.Mock).mockResolvedValue({
        ...pendingBet,
        status: 'resolved',
        outcome: 'miss',
        reflection: 'Got distracted by other priorities',
        resolvedAt: new Date(),
      })

      const result = await resolveBet(mockBetId, {
        outcome: 'miss',
        reflection: 'Got distracted by other priorities',
      })

      expect(result.outcome).toBe('miss')
      expect(result.status).toBe('resolved')
      expect(result.reflection).toBe('Got distracted by other priorities')
    })

    it('should mark bet as excused with reason', async () => {
      ;(mockPrisma.bet.findUnique as jest.Mock).mockResolvedValue(pendingBet)
      ;(mockPrisma.bet.update as jest.Mock).mockResolvedValue({
        ...pendingBet,
        status: 'resolved',
        outcome: 'excused',
        reflection: 'Project was cancelled by management',
        resolvedAt: new Date(),
      })

      const result = await resolveBet(mockBetId, {
        outcome: 'excused',
        reflection: 'Project was cancelled by management',
      })

      expect(result.outcome).toBe('excused')
      expect(result.status).toBe('resolved')
    })

    it('should not allow resolving already resolved bets', async () => {
      const resolvedBet = {
        ...pendingBet,
        status: 'resolved',
        outcome: 'hit',
      }

      ;(mockPrisma.bet.findUnique as jest.Mock).mockResolvedValue(resolvedBet)

      await expect(
        resolveBet(mockBetId, { outcome: 'miss' })
      ).rejects.toThrow('Bet has already been resolved')
    })
  })

  describe('calculateAccuracy', () => {
    it('should return 0% with no resolved bets', async () => {
      ;(mockPrisma.bet.findMany as jest.Mock).mockResolvedValue([])

      const result = await calculateAccuracy(mockUserId)

      expect(result.percentage).toBe(0)
      expect(result.total).toBe(0)
      expect(result.hits).toBe(0)
      expect(result.misses).toBe(0)
    })

    it('should calculate percentage correctly', async () => {
      const resolvedBets = [
        { outcome: 'hit', status: 'resolved' },
        { outcome: 'hit', status: 'resolved' },
        { outcome: 'miss', status: 'resolved' },
        { outcome: 'hit', status: 'resolved' },
      ]

      ;(mockPrisma.bet.findMany as jest.Mock).mockResolvedValue(resolvedBets)

      const result = await calculateAccuracy(mockUserId)

      expect(result.percentage).toBe(75) // 3 hits out of 4
      expect(result.total).toBe(4)
      expect(result.hits).toBe(3)
      expect(result.misses).toBe(1)
    })

    it('should exclude excused bets from calculation', async () => {
      const resolvedBets = [
        { outcome: 'hit', status: 'resolved' },
        { outcome: 'excused', status: 'resolved' },
        { outcome: 'miss', status: 'resolved' },
        { outcome: 'excused', status: 'resolved' },
      ]

      ;(mockPrisma.bet.findMany as jest.Mock).mockResolvedValue(resolvedBets)

      const result = await calculateAccuracy(mockUserId)

      // Only count hit and miss (2 bets), 1 hit = 50%
      expect(result.percentage).toBe(50)
      expect(result.total).toBe(2)
      expect(result.hits).toBe(1)
      expect(result.misses).toBe(1)
      expect(result.excused).toBe(2)
    })

    it('should filter by quarter when specified', async () => {
      const resolvedBets = [
        { outcome: 'hit', status: 'resolved', quarter: 'Q1-2024' },
      ]

      ;(mockPrisma.bet.findMany as jest.Mock).mockResolvedValue(resolvedBets)

      await calculateAccuracy(mockUserId, 'Q1-2024')

      expect(mockPrisma.bet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            quarter: 'Q1-2024',
          }),
        })
      )
    })
  })

  describe('getUserBets', () => {
    it('should return all bets for a user', async () => {
      const mockBets = [
        { id: 'bet-1', content: 'Bet 1', status: 'pending' },
        { id: 'bet-2', content: 'Bet 2', status: 'resolved' },
      ]

      ;(mockPrisma.bet.findMany as jest.Mock).mockResolvedValue(mockBets)

      const result = await getUserBets(mockUserId)

      expect(result).toEqual(mockBets)
      expect(mockPrisma.bet.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('getBetById', () => {
    it('should return a bet by id', async () => {
      const mockBet = { id: mockBetId, content: 'Test bet' }

      ;(mockPrisma.bet.findUnique as jest.Mock).mockResolvedValue(mockBet)

      const result = await getBetById(mockBetId)

      expect(result).toEqual(mockBet)
    })

    it('should return null for non-existent bet', async () => {
      ;(mockPrisma.bet.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await getBetById('non-existent')

      expect(result).toBeNull()
    })
  })
})
