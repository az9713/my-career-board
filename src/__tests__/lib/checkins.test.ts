/**
 * @jest-environment node
 */

// Mock Prisma
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    microCheckin: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    checkinPrompt: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    checkinStreak: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

import {
  createCheckin,
  getCheckinHistory,
  getTodayPrompt,
  getStreak,
  updateStreak,
  getCheckinInsights,
  createPrompt,
  getPrompts,
} from '@/lib/checkins/service'
import prisma from '@/lib/prisma/client'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Checkins Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createCheckin', () => {
    it('should create a new check-in', async () => {
      const checkinData = {
        userId: 'user-1',
        promptId: 'prompt-1',
        response: 'Made progress on the dashboard feature',
        mood: 4,
      }

      const mockCheckin = {
        id: 'checkin-1',
        ...checkinData,
        createdAt: new Date(),
      }

      ;(mockPrisma.microCheckin.create as jest.Mock).mockResolvedValue(mockCheckin)

      const result = await createCheckin(checkinData)

      expect(mockPrisma.microCheckin.create).toHaveBeenCalledWith({
        data: checkinData,
      })
      expect(result).toEqual(mockCheckin)
    })

    it('should create check-in without mood', async () => {
      const checkinData = {
        userId: 'user-1',
        promptId: 'prompt-1',
        response: 'Working on bugs',
      }

      const mockCheckin = {
        id: 'checkin-1',
        ...checkinData,
        mood: null,
        createdAt: new Date(),
      }

      ;(mockPrisma.microCheckin.create as jest.Mock).mockResolvedValue(mockCheckin)

      const result = await createCheckin(checkinData)

      expect(result.mood).toBeNull()
    })
  })

  describe('getCheckinHistory', () => {
    it('should retrieve check-in history for a user', async () => {
      const mockCheckins = [
        { id: 'c1', response: 'Check-in 1', createdAt: new Date() },
        { id: 'c2', response: 'Check-in 2', createdAt: new Date() },
      ]

      ;(mockPrisma.microCheckin.findMany as jest.Mock).mockResolvedValue(mockCheckins)

      const result = await getCheckinHistory('user-1')

      expect(mockPrisma.microCheckin.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { prompt: true },
        orderBy: { createdAt: 'desc' },
        take: 30,
      })
      expect(result).toHaveLength(2)
    })

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      ;(mockPrisma.microCheckin.findMany as jest.Mock).mockResolvedValue([])

      await getCheckinHistory('user-1', { startDate, endDate })

      expect(mockPrisma.microCheckin.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: { prompt: true },
        orderBy: { createdAt: 'desc' },
        take: 30,
      })
    })

    it('should limit results', async () => {
      ;(mockPrisma.microCheckin.findMany as jest.Mock).mockResolvedValue([])

      await getCheckinHistory('user-1', { limit: 10 })

      expect(mockPrisma.microCheckin.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      )
    })
  })

  describe('getTodayPrompt', () => {
    it('should return a daily prompt', async () => {
      const mockPrompt = {
        id: 'prompt-1',
        category: 'progress',
        question: 'What progress did you make today?',
        frequency: 'daily',
        isActive: true,
      }

      ;(mockPrisma.checkinPrompt.findFirst as jest.Mock).mockResolvedValue(mockPrompt)

      const result = await getTodayPrompt('user-1')

      expect(mockPrisma.checkinPrompt.findFirst).toHaveBeenCalledWith({
        where: {
          isActive: true,
          frequency: 'daily',
        },
      })
      expect(result).toEqual(mockPrompt)
    })

    it('should rotate prompts based on day', async () => {
      const mockPrompts = [
        { id: 'p1', question: 'Question 1' },
        { id: 'p2', question: 'Question 2' },
        { id: 'p3', question: 'Question 3' },
      ]

      ;(mockPrisma.checkinPrompt.findMany as jest.Mock).mockResolvedValue(mockPrompts)

      // Call with rotation enabled
      await getTodayPrompt('user-1', { rotate: true })

      expect(mockPrisma.checkinPrompt.findMany).toHaveBeenCalled()
    })
  })

  describe('getStreak', () => {
    it('should return user streak', async () => {
      const mockStreak = {
        id: 'streak-1',
        userId: 'user-1',
        currentStreak: 5,
        longestStreak: 10,
        lastCheckinAt: new Date(),
      }

      ;(mockPrisma.checkinStreak.findUnique as jest.Mock).mockResolvedValue(mockStreak)

      const result = await getStreak('user-1')

      expect(mockPrisma.checkinStreak.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      })
      expect(result).toEqual(mockStreak)
    })

    it('should return null for new user', async () => {
      ;(mockPrisma.checkinStreak.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await getStreak('new-user')

      expect(result).toBeNull()
    })
  })

  describe('updateStreak', () => {
    it('should increment streak for consecutive day', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const mockExistingStreak = {
        userId: 'user-1',
        currentStreak: 5,
        longestStreak: 10,
        lastCheckinAt: yesterday,
      }

      ;(mockPrisma.checkinStreak.findUnique as jest.Mock).mockResolvedValue(mockExistingStreak)
      ;(mockPrisma.checkinStreak.upsert as jest.Mock).mockResolvedValue({
        ...mockExistingStreak,
        currentStreak: 6,
      })

      const result = await updateStreak('user-1')

      expect(result.currentStreak).toBe(6)
    })

    it('should reset streak for missed day', async () => {
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

      const mockExistingStreak = {
        userId: 'user-1',
        currentStreak: 5,
        longestStreak: 10,
        lastCheckinAt: threeDaysAgo,
      }

      ;(mockPrisma.checkinStreak.findUnique as jest.Mock).mockResolvedValue(mockExistingStreak)
      ;(mockPrisma.checkinStreak.upsert as jest.Mock).mockResolvedValue({
        ...mockExistingStreak,
        currentStreak: 1,
      })

      const result = await updateStreak('user-1')

      expect(result.currentStreak).toBe(1)
    })

    it('should update longest streak when current exceeds it', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const mockExistingStreak = {
        userId: 'user-1',
        currentStreak: 10,
        longestStreak: 10,
        lastCheckinAt: yesterday,
      }

      ;(mockPrisma.checkinStreak.findUnique as jest.Mock).mockResolvedValue(mockExistingStreak)
      ;(mockPrisma.checkinStreak.upsert as jest.Mock).mockResolvedValue({
        ...mockExistingStreak,
        currentStreak: 11,
        longestStreak: 11,
      })

      const result = await updateStreak('user-1')

      expect(result.longestStreak).toBe(11)
    })

    it('should create new streak for first check-in', async () => {
      ;(mockPrisma.checkinStreak.findUnique as jest.Mock).mockResolvedValue(null)
      ;(mockPrisma.checkinStreak.upsert as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        currentStreak: 1,
        longestStreak: 1,
        lastCheckinAt: new Date(),
      })

      const result = await updateStreak('user-1')

      expect(result.currentStreak).toBe(1)
    })
  })

  describe('getCheckinInsights', () => {
    it('should analyze check-in patterns', async () => {
      const mockCheckins = [
        { id: 'c1', mood: 4, createdAt: new Date('2024-01-15') },
        { id: 'c2', mood: 3, createdAt: new Date('2024-01-16') },
        { id: 'c3', mood: 5, createdAt: new Date('2024-01-17') },
        { id: 'c4', mood: 4, createdAt: new Date('2024-01-18') },
      ]

      ;(mockPrisma.microCheckin.findMany as jest.Mock).mockResolvedValue(mockCheckins)
      ;(mockPrisma.microCheckin.count as jest.Mock).mockResolvedValue(4)

      const result = await getCheckinInsights('user-1')

      expect(result).toHaveProperty('totalCheckins', 4)
      expect(result).toHaveProperty('averageMood')
      expect(result.averageMood).toBeCloseTo(4, 1)
    })

    it('should identify mood trends', async () => {
      const mockCheckins = [
        { id: 'c1', mood: 2, createdAt: new Date('2024-01-15') },
        { id: 'c2', mood: 3, createdAt: new Date('2024-01-16') },
        { id: 'c3', mood: 4, createdAt: new Date('2024-01-17') },
        { id: 'c4', mood: 5, createdAt: new Date('2024-01-18') },
      ]

      ;(mockPrisma.microCheckin.findMany as jest.Mock).mockResolvedValue(mockCheckins)
      ;(mockPrisma.microCheckin.count as jest.Mock).mockResolvedValue(4)

      const result = await getCheckinInsights('user-1')

      expect(result).toHaveProperty('moodTrend')
      expect(result.moodTrend).toBe('improving')
    })
  })

  describe('createPrompt', () => {
    it('should create a new prompt', async () => {
      const promptData = {
        category: 'blockers',
        question: 'What is blocking your progress?',
        frequency: 'daily',
      }

      const mockPrompt = {
        id: 'prompt-1',
        ...promptData,
        isActive: true,
        createdAt: new Date(),
      }

      ;(mockPrisma.checkinPrompt.create as jest.Mock).mockResolvedValue(mockPrompt)

      const result = await createPrompt(promptData)

      expect(mockPrisma.checkinPrompt.create).toHaveBeenCalledWith({
        data: {
          ...promptData,
          isActive: true,
        },
      })
      expect(result).toEqual(mockPrompt)
    })
  })

  describe('getPrompts', () => {
    it('should return all active prompts', async () => {
      const mockPrompts = [
        { id: 'p1', question: 'Question 1', isActive: true },
        { id: 'p2', question: 'Question 2', isActive: true },
      ]

      ;(mockPrisma.checkinPrompt.findMany as jest.Mock).mockResolvedValue(mockPrompts)

      const result = await getPrompts()

      expect(mockPrisma.checkinPrompt.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toHaveLength(2)
    })

    it('should filter by category', async () => {
      ;(mockPrisma.checkinPrompt.findMany as jest.Mock).mockResolvedValue([])

      await getPrompts({ category: 'wins' })

      expect(mockPrisma.checkinPrompt.findMany).toHaveBeenCalledWith({
        where: { isActive: true, category: 'wins' },
        orderBy: { createdAt: 'desc' },
      })
    })
  })
})
