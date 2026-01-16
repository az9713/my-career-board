/**
 * @jest-environment node
 */

// Mock Prisma
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    decision: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    decisionOutcome: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    decisionTag: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

import {
  createDecision,
  getDecisionById,
  getUserDecisions,
  updateDecision,
  deleteDecision,
  recordOutcome,
  getDecisionsDueForReview,
  getDecisionAnalytics,
  addTags,
  removeTags,
} from '@/lib/decisions/service'
import prisma from '@/lib/prisma/client'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Decisions Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createDecision', () => {
    it('should create a new decision', async () => {
      const decisionData = {
        userId: 'user-1',
        title: 'Accept new job offer',
        description: 'Deciding whether to take the senior role at Company X',
        options: ['Accept', 'Decline', 'Negotiate'],
        prediction: 'I think accepting will accelerate my career',
        confidence: 4,
        category: 'role-change',
      }

      const mockDecision = {
        id: 'decision-1',
        ...decisionData,
        options: JSON.stringify(decisionData.options),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(mockPrisma.decision.create as jest.Mock).mockResolvedValue(mockDecision)

      const result = await createDecision(decisionData)

      expect(mockPrisma.decision.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          title: 'Accept new job offer',
        }),
      })
      expect(result).toEqual(mockDecision)
    })

    it('should set revisit date if provided', async () => {
      const revisitAt = new Date('2024-06-01')
      const decisionData = {
        userId: 'user-1',
        title: 'Project direction',
        revisitAt,
      }

      ;(mockPrisma.decision.create as jest.Mock).mockResolvedValue({
        id: 'decision-1',
        ...decisionData,
      })

      await createDecision(decisionData)

      expect(mockPrisma.decision.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          revisitAt,
        }),
      })
    })
  })

  describe('getDecisionById', () => {
    it('should retrieve decision with outcome and tags', async () => {
      const mockDecision = {
        id: 'decision-1',
        title: 'Job decision',
        outcome: { actualOutcome: 'Took the job' },
        tags: [{ tag: 'career' }],
      }

      ;(mockPrisma.decision.findUnique as jest.Mock).mockResolvedValue(mockDecision)

      const result = await getDecisionById('decision-1')

      expect(mockPrisma.decision.findUnique).toHaveBeenCalledWith({
        where: { id: 'decision-1' },
        include: {
          outcome: true,
          tags: true,
        },
      })
      expect(result).toEqual(mockDecision)
    })

    it('should return null for non-existent decision', async () => {
      ;(mockPrisma.decision.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await getDecisionById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getUserDecisions', () => {
    it('should retrieve all decisions for a user', async () => {
      const mockDecisions = [
        { id: 'd1', title: 'Decision 1', status: 'pending' },
        { id: 'd2', title: 'Decision 2', status: 'decided' },
      ]

      ;(mockPrisma.decision.findMany as jest.Mock).mockResolvedValue(mockDecisions)

      const result = await getUserDecisions('user-1')

      expect(mockPrisma.decision.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { outcome: true, tags: true },
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toHaveLength(2)
    })

    it('should filter by status', async () => {
      ;(mockPrisma.decision.findMany as jest.Mock).mockResolvedValue([])

      await getUserDecisions('user-1', { status: 'pending' })

      expect(mockPrisma.decision.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: 'pending' },
        include: { outcome: true, tags: true },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should filter by category', async () => {
      ;(mockPrisma.decision.findMany as jest.Mock).mockResolvedValue([])

      await getUserDecisions('user-1', { category: 'role-change' })

      expect(mockPrisma.decision.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', category: 'role-change' },
        include: { outcome: true, tags: true },
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('updateDecision', () => {
    it('should update decision fields', async () => {
      const updates = {
        title: 'Updated title',
        chosenOption: 'Accept',
        status: 'decided',
        decidedAt: new Date(),
      }

      const mockUpdated = {
        id: 'decision-1',
        ...updates,
      }

      ;(mockPrisma.decision.update as jest.Mock).mockResolvedValue(mockUpdated)

      const result = await updateDecision('decision-1', updates)

      expect(mockPrisma.decision.update).toHaveBeenCalledWith({
        where: { id: 'decision-1' },
        data: updates,
        include: { outcome: true, tags: true },
      })
      expect(result.status).toBe('decided')
    })
  })

  describe('deleteDecision', () => {
    it('should delete a decision', async () => {
      ;(mockPrisma.decision.delete as jest.Mock).mockResolvedValue({ id: 'decision-1' })

      await deleteDecision('decision-1')

      expect(mockPrisma.decision.delete).toHaveBeenCalledWith({
        where: { id: 'decision-1' },
      })
    })
  })

  describe('recordOutcome', () => {
    it('should record decision outcome', async () => {
      const outcomeData = {
        decisionId: 'decision-1',
        actualOutcome: 'Took the job and it was a great decision',
        accuracy: 5,
        lessonsLearned: 'Trust my instincts more',
      }

      const mockOutcome = {
        id: 'outcome-1',
        ...outcomeData,
        reviewedAt: new Date(),
      }

      ;(mockPrisma.decisionOutcome.create as jest.Mock).mockResolvedValue(mockOutcome)
      ;(mockPrisma.decision.update as jest.Mock).mockResolvedValue({})

      const result = await recordOutcome(outcomeData)

      expect(mockPrisma.decisionOutcome.create).toHaveBeenCalledWith({
        data: outcomeData,
      })
      expect(mockPrisma.decision.update).toHaveBeenCalledWith({
        where: { id: 'decision-1' },
        data: { status: 'closed' },
      })
      expect(result).toEqual(mockOutcome)
    })
  })

  describe('getDecisionsDueForReview', () => {
    it('should return decisions due for review', async () => {
      const mockDecisions = [
        { id: 'd1', title: 'Decision 1', revisitAt: new Date('2024-01-15') },
      ]

      ;(mockPrisma.decision.findMany as jest.Mock).mockResolvedValue(mockDecisions)

      const result = await getDecisionsDueForReview('user-1')

      expect(mockPrisma.decision.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          status: { in: ['decided', 'reviewing'] },
          revisitAt: { lte: expect.any(Date) },
        },
        include: { outcome: true, tags: true },
        orderBy: { revisitAt: 'asc' },
      })
      expect(result).toHaveLength(1)
    })
  })

  describe('getDecisionAnalytics', () => {
    it('should calculate decision analytics', async () => {
      const mockDecisions = [
        { id: 'd1', status: 'closed', outcome: { accuracy: 5 } },
        { id: 'd2', status: 'closed', outcome: { accuracy: 4 } },
        { id: 'd3', status: 'closed', outcome: { accuracy: 3 } },
        { id: 'd4', status: 'pending', outcome: null },
      ]

      ;(mockPrisma.decision.findMany as jest.Mock).mockResolvedValue(mockDecisions)
      ;(mockPrisma.decision.count as jest.Mock).mockResolvedValue(4)

      const result = await getDecisionAnalytics('user-1')

      expect(result).toHaveProperty('totalDecisions', 4)
      expect(result).toHaveProperty('averageAccuracy')
      expect(result.averageAccuracy).toBeCloseTo(4, 1)
      expect(result).toHaveProperty('decisionsByStatus')
    })

    it('should handle no decisions', async () => {
      ;(mockPrisma.decision.findMany as jest.Mock).mockResolvedValue([])
      ;(mockPrisma.decision.count as jest.Mock).mockResolvedValue(0)

      const result = await getDecisionAnalytics('user-1')

      expect(result.totalDecisions).toBe(0)
      expect(result.averageAccuracy).toBeNull()
    })
  })

  describe('addTags', () => {
    it('should add tags to a decision', async () => {
      const tags = ['career', 'high-stakes']

      ;(mockPrisma.decisionTag.createMany as jest.Mock).mockResolvedValue({ count: 2 })

      await addTags('decision-1', tags)

      expect(mockPrisma.decisionTag.createMany).toHaveBeenCalledWith({
        data: [
          { decisionId: 'decision-1', tag: 'career' },
          { decisionId: 'decision-1', tag: 'high-stakes' },
        ],
        skipDuplicates: true,
      })
    })
  })

  describe('removeTags', () => {
    it('should remove tags from a decision', async () => {
      const tags = ['career']

      ;(mockPrisma.decisionTag.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })

      await removeTags('decision-1', tags)

      expect(mockPrisma.decisionTag.deleteMany).toHaveBeenCalledWith({
        where: {
          decisionId: 'decision-1',
          tag: { in: tags },
        },
      })
    })
  })
})
