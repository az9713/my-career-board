/**
 * @jest-environment node
 */

// Mock Prisma
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    evidence: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    evidenceProblemLink: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

import {
  createEvidence,
  getEvidenceById,
  getUserEvidence,
  updateEvidence,
  deleteEvidence,
  linkEvidenceToProblem,
  unlinkEvidenceFromProblem,
  getEvidenceByProblem,
  getEvidenceSummary,
  searchEvidence,
} from '@/lib/evidence/service'
import prisma from '@/lib/prisma/client'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Evidence Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createEvidence', () => {
    it('should create new evidence', async () => {
      const evidenceData = {
        userId: 'user-1',
        title: 'Shipped new feature',
        description: 'Led the development of the new dashboard',
        type: 'win',
        source: 'self',
        impact: 'Increased user engagement by 25%',
      }

      const mockEvidence = {
        id: 'evidence-1',
        ...evidenceData,
        date: new Date(),
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(mockPrisma.evidence.create as jest.Mock).mockResolvedValue(mockEvidence)

      const result = await createEvidence(evidenceData)

      expect(mockPrisma.evidence.create).toHaveBeenCalledWith({
        data: evidenceData,
      })
      expect(result).toEqual(mockEvidence)
    })

    it('should create evidence with custom date', async () => {
      const customDate = new Date('2024-06-15')
      const evidenceData = {
        userId: 'user-1',
        title: 'Q2 Performance Review',
        type: 'feedback',
        source: 'manager',
        date: customDate,
      }

      const mockEvidence = {
        id: 'evidence-2',
        ...evidenceData,
        description: null,
        impact: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(mockPrisma.evidence.create as jest.Mock).mockResolvedValue(mockEvidence)

      const result = await createEvidence(evidenceData)

      expect(mockPrisma.evidence.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ date: customDate }),
      })
      expect(result.date).toEqual(customDate)
    })
  })

  describe('getEvidenceById', () => {
    it('should retrieve evidence by id', async () => {
      const mockEvidence = {
        id: 'evidence-1',
        userId: 'user-1',
        title: 'Big Win',
        type: 'win',
        attachments: [],
        problemLinks: [],
      }

      ;(mockPrisma.evidence.findUnique as jest.Mock).mockResolvedValue(mockEvidence)

      const result = await getEvidenceById('evidence-1')

      expect(mockPrisma.evidence.findUnique).toHaveBeenCalledWith({
        where: { id: 'evidence-1' },
        include: {
          attachments: true,
          problemLinks: true,
        },
      })
      expect(result).toEqual(mockEvidence)
    })

    it('should return null for non-existent evidence', async () => {
      ;(mockPrisma.evidence.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await getEvidenceById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getUserEvidence', () => {
    it('should retrieve all evidence for a user', async () => {
      const mockEvidenceList = [
        { id: 'evidence-1', title: 'Win 1', type: 'win' },
        { id: 'evidence-2', title: 'Feedback 1', type: 'feedback' },
      ]

      ;(mockPrisma.evidence.findMany as jest.Mock).mockResolvedValue(mockEvidenceList)

      const result = await getUserEvidence('user-1')

      expect(mockPrisma.evidence.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          attachments: true,
          problemLinks: true,
        },
        orderBy: { date: 'desc' },
      })
      expect(result).toHaveLength(2)
    })

    it('should filter evidence by type', async () => {
      const mockWins = [{ id: 'evidence-1', title: 'Win 1', type: 'win' }]

      ;(mockPrisma.evidence.findMany as jest.Mock).mockResolvedValue(mockWins)

      const result = await getUserEvidence('user-1', { type: 'win' })

      expect(mockPrisma.evidence.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', type: 'win' },
        include: {
          attachments: true,
          problemLinks: true,
        },
        orderBy: { date: 'desc' },
      })
      expect(result).toHaveLength(1)
    })

    it('should filter evidence by date range', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-03-31')

      ;(mockPrisma.evidence.findMany as jest.Mock).mockResolvedValue([])

      await getUserEvidence('user-1', { startDate, endDate })

      expect(mockPrisma.evidence.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          attachments: true,
          problemLinks: true,
        },
        orderBy: { date: 'desc' },
      })
    })
  })

  describe('updateEvidence', () => {
    it('should update evidence', async () => {
      const updates = {
        title: 'Updated Title',
        impact: 'Even bigger impact',
      }

      const mockUpdated = {
        id: 'evidence-1',
        ...updates,
        type: 'win',
        userId: 'user-1',
      }

      ;(mockPrisma.evidence.update as jest.Mock).mockResolvedValue(mockUpdated)

      const result = await updateEvidence('evidence-1', updates)

      expect(mockPrisma.evidence.update).toHaveBeenCalledWith({
        where: { id: 'evidence-1' },
        data: updates,
      })
      expect(result.title).toBe('Updated Title')
    })
  })

  describe('deleteEvidence', () => {
    it('should delete evidence', async () => {
      ;(mockPrisma.evidence.delete as jest.Mock).mockResolvedValue({ id: 'evidence-1' })

      await deleteEvidence('evidence-1')

      expect(mockPrisma.evidence.delete).toHaveBeenCalledWith({
        where: { id: 'evidence-1' },
      })
    })
  })

  describe('linkEvidenceToProblem', () => {
    it('should link evidence to a problem', async () => {
      const mockLink = {
        id: 'link-1',
        evidenceId: 'evidence-1',
        problemId: 'problem-1',
      }

      ;(mockPrisma.evidenceProblemLink.create as jest.Mock).mockResolvedValue(mockLink)

      const result = await linkEvidenceToProblem('evidence-1', 'problem-1')

      expect(mockPrisma.evidenceProblemLink.create).toHaveBeenCalledWith({
        data: {
          evidenceId: 'evidence-1',
          problemId: 'problem-1',
        },
      })
      expect(result).toEqual(mockLink)
    })
  })

  describe('unlinkEvidenceFromProblem', () => {
    it('should unlink evidence from a problem', async () => {
      ;(mockPrisma.evidenceProblemLink.delete as jest.Mock).mockResolvedValue({})

      await unlinkEvidenceFromProblem('evidence-1', 'problem-1')

      expect(mockPrisma.evidenceProblemLink.delete).toHaveBeenCalledWith({
        where: {
          evidenceId_problemId: {
            evidenceId: 'evidence-1',
            problemId: 'problem-1',
          },
        },
      })
    })
  })

  describe('getEvidenceByProblem', () => {
    it('should get all evidence linked to a problem', async () => {
      const mockLinks = [
        { evidenceId: 'evidence-1', problemId: 'problem-1' },
        { evidenceId: 'evidence-2', problemId: 'problem-1' },
      ]

      const mockEvidence = [
        { id: 'evidence-1', title: 'Win 1' },
        { id: 'evidence-2', title: 'Win 2' },
      ]

      ;(mockPrisma.evidenceProblemLink.findMany as jest.Mock).mockResolvedValue(mockLinks)
      ;(mockPrisma.evidence.findMany as jest.Mock).mockResolvedValue(mockEvidence)

      const result = await getEvidenceByProblem('problem-1')

      expect(mockPrisma.evidenceProblemLink.findMany).toHaveBeenCalledWith({
        where: { problemId: 'problem-1' },
      })
      expect(result).toHaveLength(2)
    })
  })

  describe('getEvidenceSummary', () => {
    it('should generate evidence summary for a user', async () => {
      const mockEvidence = [
        { id: 'e1', type: 'win', title: 'Shipped feature', date: new Date('2024-01-15') },
        { id: 'e2', type: 'win', title: 'Got promotion', date: new Date('2024-02-20') },
        { id: 'e3', type: 'feedback', title: 'Great review', date: new Date('2024-03-01') },
        { id: 'e4', type: 'metric', title: 'Revenue up', date: new Date('2024-03-10') },
      ]

      ;(mockPrisma.evidence.findMany as jest.Mock).mockResolvedValue(mockEvidence)
      ;(mockPrisma.evidence.count as jest.Mock).mockResolvedValue(4)

      const result = await getEvidenceSummary('user-1')

      expect(result).toHaveProperty('totalCount', 4)
      expect(result).toHaveProperty('byType')
      expect(result.byType.win).toBe(2)
      expect(result.byType.feedback).toBe(1)
      expect(result.byType.metric).toBe(1)
      expect(result).toHaveProperty('recentEvidence')
    })

    it('should filter summary by date range', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-03-31')

      ;(mockPrisma.evidence.findMany as jest.Mock).mockResolvedValue([])
      ;(mockPrisma.evidence.count as jest.Mock).mockResolvedValue(0)

      await getEvidenceSummary('user-1', { startDate, endDate })

      expect(mockPrisma.evidence.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: { gte: startDate, lte: endDate },
          }),
        })
      )
    })
  })

  describe('searchEvidence', () => {
    it('should search evidence by keyword', async () => {
      const mockResults = [
        { id: 'e1', title: 'Dashboard feature shipped', description: 'Built new dashboard' },
      ]

      ;(mockPrisma.evidence.findMany as jest.Mock).mockResolvedValue(mockResults)

      const result = await searchEvidence('user-1', 'dashboard')

      expect(mockPrisma.evidence.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          OR: [
            { title: { contains: 'dashboard' } },
            { description: { contains: 'dashboard' } },
            { impact: { contains: 'dashboard' } },
          ],
        },
        include: {
          attachments: true,
          problemLinks: true,
        },
        orderBy: { date: 'desc' },
      })
      expect(result).toHaveLength(1)
    })
  })
})
