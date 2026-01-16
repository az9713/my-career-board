import {
  createLearningResource,
  getLearningResourceById,
  getUserLearningResources,
  updateLearningResource,
  deleteLearningResource,
  createCertification,
  getCertificationById,
  getUserCertifications,
  updateCertification,
  createLearningGoal,
  getLearningGoalById,
  getUserLearningGoals,
  updateLearningGoal,
  getLearningAnalytics,
  getExpiringCertifications,
} from '@/lib/learning/service'

// Mock Prisma client
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    learningResource: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    certification: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    learningGoal: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import prisma from '@/lib/prisma/client'

describe('Learning Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createLearningResource', () => {
    it('should create a learning resource', async () => {
      const mockResource = {
        id: 'lr1',
        userId: 'user1',
        title: 'TypeScript Fundamentals',
        type: 'course',
        provider: 'Udemy',
        status: 'in_progress',
      }

      ;(prisma.learningResource.create as jest.Mock).mockResolvedValue(mockResource)

      const result = await createLearningResource({
        userId: 'user1',
        title: 'TypeScript Fundamentals',
        type: 'course',
        provider: 'Udemy',
      })

      expect(result).toEqual(mockResource)
      expect(prisma.learningResource.create).toHaveBeenCalled()
    })
  })

  describe('getLearningResourceById', () => {
    it('should return a learning resource', async () => {
      const mockResource = {
        id: 'lr1',
        title: 'TypeScript Fundamentals',
        progress: 50,
      }

      ;(prisma.learningResource.findUnique as jest.Mock).mockResolvedValue(mockResource)

      const result = await getLearningResourceById('lr1')

      expect(result).toEqual(mockResource)
    })
  })

  describe('getUserLearningResources', () => {
    it('should return learning resources', async () => {
      const mockResources = [
        { id: 'lr1', title: 'TypeScript', status: 'in_progress' },
        { id: 'lr2', title: 'React', status: 'completed' },
      ]

      ;(prisma.learningResource.findMany as jest.Mock).mockResolvedValue(mockResources)

      const result = await getUserLearningResources('user1')

      expect(result).toHaveLength(2)
    })

    it('should filter by status', async () => {
      ;(prisma.learningResource.findMany as jest.Mock).mockResolvedValue([])

      await getUserLearningResources('user1', { status: 'completed' })

      expect(prisma.learningResource.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1', status: 'completed' },
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('updateLearningResource', () => {
    it('should update a learning resource', async () => {
      const mockResource = { id: 'lr1', progress: 75 }

      ;(prisma.learningResource.update as jest.Mock).mockResolvedValue(mockResource)

      const result = await updateLearningResource('lr1', { progress: 75 })

      expect(result.progress).toBe(75)
    })
  })

  describe('deleteLearningResource', () => {
    it('should delete a learning resource', async () => {
      ;(prisma.learningResource.delete as jest.Mock).mockResolvedValue({ id: 'lr1' })

      await deleteLearningResource('lr1')

      expect(prisma.learningResource.delete).toHaveBeenCalledWith({
        where: { id: 'lr1' },
      })
    })
  })

  describe('createCertification', () => {
    it('should create a certification', async () => {
      const mockCert = {
        id: 'cert1',
        userId: 'user1',
        name: 'AWS Solutions Architect',
        issuer: 'Amazon',
        status: 'active',
      }

      ;(prisma.certification.create as jest.Mock).mockResolvedValue(mockCert)

      const result = await createCertification({
        userId: 'user1',
        name: 'AWS Solutions Architect',
        issuer: 'Amazon',
        earnedAt: new Date('2024-01-01'),
      })

      expect(result).toEqual(mockCert)
    })
  })

  describe('getCertificationById', () => {
    it('should return a certification', async () => {
      const mockCert = {
        id: 'cert1',
        name: 'AWS Solutions Architect',
      }

      ;(prisma.certification.findUnique as jest.Mock).mockResolvedValue(mockCert)

      const result = await getCertificationById('cert1')

      expect(result?.name).toBe('AWS Solutions Architect')
    })
  })

  describe('getUserCertifications', () => {
    it('should return user certifications', async () => {
      const mockCerts = [
        { id: 'c1', name: 'AWS', status: 'active' },
        { id: 'c2', name: 'GCP', status: 'expired' },
      ]

      ;(prisma.certification.findMany as jest.Mock).mockResolvedValue(mockCerts)

      const result = await getUserCertifications('user1')

      expect(result).toHaveLength(2)
    })
  })

  describe('updateCertification', () => {
    it('should update a certification', async () => {
      const mockCert = { id: 'cert1', status: 'expired' }

      ;(prisma.certification.update as jest.Mock).mockResolvedValue(mockCert)

      const result = await updateCertification('cert1', { status: 'expired' })

      expect(result.status).toBe('expired')
    })
  })

  describe('createLearningGoal', () => {
    it('should create a learning goal', async () => {
      const mockGoal = {
        id: 'goal1',
        userId: 'user1',
        title: 'Master TypeScript',
        status: 'active',
      }

      ;(prisma.learningGoal.create as jest.Mock).mockResolvedValue(mockGoal)

      const result = await createLearningGoal({
        userId: 'user1',
        title: 'Master TypeScript',
        targetDate: new Date('2024-12-31'),
      })

      expect(result).toEqual(mockGoal)
    })
  })

  describe('getLearningGoalById', () => {
    it('should return a learning goal', async () => {
      const mockGoal = { id: 'goal1', title: 'Master TypeScript' }

      ;(prisma.learningGoal.findUnique as jest.Mock).mockResolvedValue(mockGoal)

      const result = await getLearningGoalById('goal1')

      expect(result?.title).toBe('Master TypeScript')
    })
  })

  describe('getUserLearningGoals', () => {
    it('should return user learning goals', async () => {
      const mockGoals = [
        { id: 'g1', title: 'TypeScript', progress: 50 },
        { id: 'g2', title: 'React', progress: 25 },
      ]

      ;(prisma.learningGoal.findMany as jest.Mock).mockResolvedValue(mockGoals)

      const result = await getUserLearningGoals('user1')

      expect(result).toHaveLength(2)
    })
  })

  describe('updateLearningGoal', () => {
    it('should update a learning goal', async () => {
      const mockGoal = { id: 'goal1', progress: 75 }

      ;(prisma.learningGoal.update as jest.Mock).mockResolvedValue(mockGoal)

      const result = await updateLearningGoal('goal1', { progress: 75 })

      expect(result.progress).toBe(75)
    })
  })

  describe('getLearningAnalytics', () => {
    it('should return learning analytics', async () => {
      ;(prisma.learningResource.findMany as jest.Mock).mockResolvedValue([
        { status: 'completed', hoursSpent: 10 },
        { status: 'in_progress', hoursSpent: 5 },
      ])
      ;(prisma.certification.findMany as jest.Mock).mockResolvedValue([
        { status: 'active' },
        { status: 'expired' },
      ])
      ;(prisma.learningGoal.findMany as jest.Mock).mockResolvedValue([
        { status: 'active', progress: 50 },
      ])

      const result = await getLearningAnalytics('user1')

      expect(result.totalResources).toBeDefined()
      expect(result.activeCertifications).toBeDefined()
    })
  })

  describe('getExpiringCertifications', () => {
    it('should return expiring certifications', async () => {
      const mockCerts = [
        { id: 'c1', name: 'AWS', expiresAt: new Date('2024-04-01') },
      ]

      ;(prisma.certification.findMany as jest.Mock).mockResolvedValue(mockCerts)

      const result = await getExpiringCertifications('user1', 30)

      expect(result).toHaveLength(1)
    })
  })
})
