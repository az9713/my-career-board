/**
 * @jest-environment node
 */

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

// Mock checkins service
jest.mock('@/lib/checkins/service', () => ({
  createCheckin: jest.fn(),
  getCheckinHistory: jest.fn(),
  getTodayPrompt: jest.fn(),
  getStreak: jest.fn(),
  updateStreak: jest.fn(),
  getCheckinInsights: jest.fn(),
}))

import { auth } from '@/auth'
import {
  createCheckin,
  getCheckinHistory,
  getTodayPrompt,
  getStreak,
  updateStreak,
  getCheckinInsights,
} from '@/lib/checkins/service'
import { GET, POST } from '@/app/api/checkins/route'
import { GET as getToday } from '@/app/api/checkins/today/route'
import { GET as getStreakRoute } from '@/app/api/checkins/streak/route'
import { GET as getInsights } from '@/app/api/checkins/insights/route'

const mockAuth = auth as jest.Mock

describe('Checkins API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/checkins', () => {
    it('should return 401 if not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new Request('http://localhost/api/checkins')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should return check-in history', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockHistory = [
        { id: 'c1', response: 'Check-in 1', createdAt: new Date() },
        { id: 'c2', response: 'Check-in 2', createdAt: new Date() },
      ]
      ;(getCheckinHistory as jest.Mock).mockResolvedValue(mockHistory)

      const request = new Request('http://localhost/api/checkins')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.checkins).toHaveLength(2)
    })

    it('should support date range filter', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
      ;(getCheckinHistory as jest.Mock).mockResolvedValue([])

      const request = new Request(
        'http://localhost/api/checkins?startDate=2024-01-01&endDate=2024-01-31'
      )
      await GET(request)

      expect(getCheckinHistory).toHaveBeenCalledWith('user-1', {
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      })
    })
  })

  describe('POST /api/checkins', () => {
    it('should return 401 if not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new Request('http://localhost/api/checkins', {
        method: 'POST',
        body: JSON.stringify({ promptId: 'p1', response: 'test' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should create a new check-in', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const checkinData = {
        promptId: 'prompt-1',
        response: 'Made progress today',
        mood: 4,
      }

      const mockCheckin = { id: 'c1', ...checkinData, userId: 'user-1' }
      ;(createCheckin as jest.Mock).mockResolvedValue(mockCheckin)
      ;(updateStreak as jest.Mock).mockResolvedValue({ currentStreak: 1 })

      const request = new Request('http://localhost/api/checkins', {
        method: 'POST',
        body: JSON.stringify(checkinData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.checkin.id).toBe('c1')
      expect(updateStreak).toHaveBeenCalledWith('user-1')
    })

    it('should return 400 for missing required fields', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const request = new Request('http://localhost/api/checkins', {
        method: 'POST',
        body: JSON.stringify({ mood: 3 }),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/checkins/today', () => {
    it('should return today\'s prompt', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockPrompt = {
        id: 'prompt-1',
        question: 'What progress did you make today?',
        category: 'progress',
      }
      ;(getTodayPrompt as jest.Mock).mockResolvedValue(mockPrompt)

      const request = new Request('http://localhost/api/checkins/today')
      const response = await getToday(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.prompt.question).toBe('What progress did you make today?')
    })

    it('should return 404 if no prompt available', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
      ;(getTodayPrompt as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost/api/checkins/today')
      const response = await getToday(request)

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/checkins/streak', () => {
    it('should return user streak', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockStreak = {
        currentStreak: 5,
        longestStreak: 10,
        lastCheckinAt: new Date(),
      }
      ;(getStreak as jest.Mock).mockResolvedValue(mockStreak)

      const request = new Request('http://localhost/api/checkins/streak')
      const response = await getStreakRoute(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.streak.currentStreak).toBe(5)
    })

    it('should return empty streak for new user', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
      ;(getStreak as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost/api/checkins/streak')
      const response = await getStreakRoute(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.streak).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        lastCheckinAt: null,
      })
    })
  })

  describe('GET /api/checkins/insights', () => {
    it('should return check-in insights', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockInsights = {
        totalCheckins: 30,
        averageMood: 3.8,
        moodTrend: 'improving',
        checkinsByDay: {},
      }
      ;(getCheckinInsights as jest.Mock).mockResolvedValue(mockInsights)

      const request = new Request('http://localhost/api/checkins/insights')
      const response = await getInsights(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.insights.totalCheckins).toBe(30)
      expect(data.insights.moodTrend).toBe('improving')
    })
  })
})
