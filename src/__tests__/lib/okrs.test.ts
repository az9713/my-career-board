import {
  createOKRPeriod,
  getOKRPeriodById,
  getUserOKRPeriods,
  updateOKRPeriod,
  createObjective,
  getObjectiveById,
  getPeriodObjectives,
  updateObjective,
  deleteObjective,
  createKeyResult,
  getKeyResultById,
  updateKeyResult,
  checkInKeyResult,
  getKeyResultHistory,
  calculateObjectiveProgress,
  getOKRAnalytics,
} from '@/lib/okrs/service'

// Mock Prisma client
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    oKRPeriod: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    objective: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    keyResult: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    keyResultCheckIn: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

import prisma from '@/lib/prisma/client'

describe('OKRs Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createOKRPeriod', () => {
    it('should create an OKR period', async () => {
      const mockPeriod = {
        id: 'period1',
        userId: 'user1',
        name: 'Q1 2024',
        type: 'quarter',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.oKRPeriod.create as jest.Mock).mockResolvedValue(mockPeriod)

      const result = await createOKRPeriod({
        userId: 'user1',
        name: 'Q1 2024',
        type: 'quarter',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
      })

      expect(result).toEqual(mockPeriod)
      expect(prisma.oKRPeriod.create).toHaveBeenCalled()
    })
  })

  describe('getOKRPeriodById', () => {
    it('should return period with objectives', async () => {
      const mockPeriod = {
        id: 'period1',
        name: 'Q1 2024',
        objectives: [
          { id: 'obj1', title: 'Objective 1', keyResults: [] },
        ],
      }

      ;(prisma.oKRPeriod.findUnique as jest.Mock).mockResolvedValue(mockPeriod)

      const result = await getOKRPeriodById('period1')

      expect(result).toEqual(mockPeriod)
      expect(prisma.oKRPeriod.findUnique).toHaveBeenCalledWith({
        where: { id: 'period1' },
        include: {
          objectives: {
            include: { keyResults: true },
            orderBy: { priority: 'asc' },
          },
        },
      })
    })
  })

  describe('getUserOKRPeriods', () => {
    it('should return user OKR periods', async () => {
      const mockPeriods = [
        { id: 'p1', name: 'Q1 2024', status: 'active' },
        { id: 'p2', name: 'Q4 2023', status: 'completed' },
      ]

      ;(prisma.oKRPeriod.findMany as jest.Mock).mockResolvedValue(mockPeriods)

      const result = await getUserOKRPeriods('user1')

      expect(result).toEqual(mockPeriods)
    })

    it('should filter by status', async () => {
      const mockPeriods = [{ id: 'p1', name: 'Q1 2024', status: 'active' }]

      ;(prisma.oKRPeriod.findMany as jest.Mock).mockResolvedValue(mockPeriods)

      const result = await getUserOKRPeriods('user1', 'active')

      expect(result).toHaveLength(1)
    })
  })

  describe('updateOKRPeriod', () => {
    it('should update period status', async () => {
      const mockPeriod = { id: 'period1', status: 'completed' }

      ;(prisma.oKRPeriod.update as jest.Mock).mockResolvedValue(mockPeriod)

      const result = await updateOKRPeriod('period1', { status: 'completed' })

      expect(result.status).toBe('completed')
    })
  })

  describe('createObjective', () => {
    it('should create an objective', async () => {
      const mockObjective = {
        id: 'obj1',
        periodId: 'period1',
        userId: 'user1',
        title: 'Increase team productivity',
        description: 'Focus on developer experience',
        category: 'impact',
        priority: 1,
        progress: 0,
        status: 'on-track',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.objective.create as jest.Mock).mockResolvedValue(mockObjective)

      const result = await createObjective({
        periodId: 'period1',
        userId: 'user1',
        title: 'Increase team productivity',
        description: 'Focus on developer experience',
        category: 'impact',
        priority: 1,
      })

      expect(result).toEqual(mockObjective)
    })
  })

  describe('getObjectiveById', () => {
    it('should return objective with key results', async () => {
      const mockObjective = {
        id: 'obj1',
        title: 'Objective 1',
        keyResults: [
          { id: 'kr1', title: 'Key Result 1', progress: 50 },
        ],
      }

      ;(prisma.objective.findUnique as jest.Mock).mockResolvedValue(mockObjective)

      const result = await getObjectiveById('obj1')

      expect(result?.keyResults).toHaveLength(1)
    })
  })

  describe('getPeriodObjectives', () => {
    it('should return objectives for a period', async () => {
      const mockObjectives = [
        { id: 'obj1', title: 'Objective 1', priority: 1 },
        { id: 'obj2', title: 'Objective 2', priority: 2 },
      ]

      ;(prisma.objective.findMany as jest.Mock).mockResolvedValue(mockObjectives)

      const result = await getPeriodObjectives('period1')

      expect(result).toHaveLength(2)
    })
  })

  describe('updateObjective', () => {
    it('should update objective', async () => {
      const mockObjective = { id: 'obj1', status: 'at-risk' }

      ;(prisma.objective.update as jest.Mock).mockResolvedValue(mockObjective)

      const result = await updateObjective('obj1', { status: 'at-risk' })

      expect(result.status).toBe('at-risk')
    })
  })

  describe('deleteObjective', () => {
    it('should delete objective', async () => {
      ;(prisma.objective.delete as jest.Mock).mockResolvedValue({ id: 'obj1' })

      await deleteObjective('obj1')

      expect(prisma.objective.delete).toHaveBeenCalledWith({
        where: { id: 'obj1' },
      })
    })
  })

  describe('createKeyResult', () => {
    it('should create a key result', async () => {
      const mockKeyResult = {
        id: 'kr1',
        objectiveId: 'obj1',
        title: 'Reduce deployment time',
        metricType: 'number',
        targetValue: 30,
        currentValue: 0,
        startValue: 60,
        unit: 'minutes',
        progress: 0,
        status: 'on-track',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.keyResult.create as jest.Mock).mockResolvedValue(mockKeyResult)

      const result = await createKeyResult({
        objectiveId: 'obj1',
        title: 'Reduce deployment time',
        metricType: 'number',
        targetValue: 30,
        startValue: 60,
        unit: 'minutes',
      })

      expect(result).toEqual(mockKeyResult)
    })
  })

  describe('getKeyResultById', () => {
    it('should return key result with check-ins', async () => {
      const mockKeyResult = {
        id: 'kr1',
        title: 'Key Result 1',
        checkIns: [
          { id: 'ci1', value: 50, createdAt: new Date() },
        ],
      }

      ;(prisma.keyResult.findUnique as jest.Mock).mockResolvedValue(mockKeyResult)

      const result = await getKeyResultById('kr1')

      expect(result?.checkIns).toHaveLength(1)
    })
  })

  describe('updateKeyResult', () => {
    it('should update key result and calculate progress', async () => {
      const mockKeyResult = {
        id: 'kr1',
        currentValue: 45,
        targetValue: 30,
        startValue: 60,
        progress: 50,
      }

      ;(prisma.keyResult.update as jest.Mock).mockResolvedValue(mockKeyResult)

      const result = await updateKeyResult('kr1', { currentValue: 45 })

      expect(result.progress).toBe(50)
    })
  })

  describe('checkInKeyResult', () => {
    it('should create a check-in and update key result', async () => {
      const mockCheckIn = {
        id: 'ci1',
        keyResultId: 'kr1',
        value: 45,
        previousValue: 50,
        notes: 'Good progress this week',
        createdAt: new Date(),
      }

      ;(prisma.keyResult.findUnique as jest.Mock).mockResolvedValue({
        currentValue: 50,
        targetValue: 30,
        startValue: 60,
      })
      ;(prisma.keyResultCheckIn.create as jest.Mock).mockResolvedValue(mockCheckIn)
      ;(prisma.keyResult.update as jest.Mock).mockResolvedValue({
        id: 'kr1',
        currentValue: 45,
        progress: 50,
      })

      const result = await checkInKeyResult('kr1', 45, 'Good progress this week')

      expect(result.value).toBe(45)
      expect(prisma.keyResultCheckIn.create).toHaveBeenCalled()
      expect(prisma.keyResult.update).toHaveBeenCalled()
    })
  })

  describe('getKeyResultHistory', () => {
    it('should return check-in history', async () => {
      const mockHistory = [
        { id: 'ci1', value: 45, createdAt: new Date('2024-03-15') },
        { id: 'ci2', value: 50, createdAt: new Date('2024-03-01') },
      ]

      ;(prisma.keyResultCheckIn.findMany as jest.Mock).mockResolvedValue(mockHistory)

      const result = await getKeyResultHistory('kr1')

      expect(result).toHaveLength(2)
    })
  })

  describe('calculateObjectiveProgress', () => {
    it('should calculate average progress from key results', async () => {
      ;(prisma.keyResult.findMany as jest.Mock).mockResolvedValue([
        { progress: 100 },
        { progress: 50 },
        { progress: 25 },
      ])
      ;(prisma.objective.update as jest.Mock).mockResolvedValue({
        id: 'obj1',
        progress: 58,
      })

      const result = await calculateObjectiveProgress('obj1')

      expect(result).toBe(58)
    })
  })

  describe('getOKRAnalytics', () => {
    it('should return OKR analytics', async () => {
      ;(prisma.oKRPeriod.findMany as jest.Mock).mockResolvedValue([
        { id: 'p1', status: 'active' },
      ])
      ;(prisma.objective.count as jest.Mock).mockResolvedValue(5)
      ;(prisma.objective.findMany as jest.Mock).mockResolvedValue([
        { status: 'on-track', progress: 75 },
        { status: 'at-risk', progress: 30 },
        { status: 'completed', progress: 100 },
      ])
      ;(prisma.keyResult.findMany as jest.Mock).mockResolvedValue([
        { progress: 100 },
        { progress: 50 },
      ])

      const result = await getOKRAnalytics('user1')

      expect(result.totalObjectives).toBe(5)
      expect(result.statusBreakdown).toBeDefined()
      expect(result.averageProgress).toBeDefined()
    })
  })
})
