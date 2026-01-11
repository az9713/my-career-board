/**
 * @jest-environment node
 */

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

// Mock Prisma
jest.mock('@/lib/prisma/client', () => ({
  __esModule: true,
  default: {
    bet: {
      findMany: jest.fn(),
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

// Mock analytics service
jest.mock('@/lib/analytics/service', () => ({
  getBetAccuracyTrend: jest.fn(),
  getTimeAllocationHistory: jest.fn(),
  getAvoidancePatterns: jest.fn(),
  getQuarterlyMetrics: jest.fn(),
  calculateBetAccuracy: jest.fn(),
}))

import { GET as getAnalytics } from '@/app/api/analytics/route'
import { GET as getBetTrend } from '@/app/api/analytics/bets/route'
import { auth } from '@/auth'
import {
  getBetAccuracyTrend,
  getTimeAllocationHistory,
  getAvoidancePatterns,
  calculateBetAccuracy,
} from '@/lib/analytics/service'

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockGetBetAccuracyTrend = getBetAccuracyTrend as jest.MockedFunction<typeof getBetAccuracyTrend>
const mockGetTimeAllocation = getTimeAllocationHistory as jest.MockedFunction<typeof getTimeAllocationHistory>
const mockGetAvoidancePatterns = getAvoidancePatterns as jest.MockedFunction<typeof getAvoidancePatterns>
const mockCalculateBetAccuracy = calculateBetAccuracy as jest.MockedFunction<typeof calculateBetAccuracy>

describe('GET /api/analytics', () => {
  const mockUserId = 'user-123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return comprehensive analytics data', async () => {
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com' },
    } as any)

    mockCalculateBetAccuracy.mockResolvedValue({
      accuracy: 75,
      total: 8,
      hits: 6,
      misses: 2,
      excused: 0,
    })

    mockGetBetAccuracyTrend.mockResolvedValue([
      { quarter: 'Q1-2025', accuracy: 50, total: 2, hits: 1, misses: 1 },
      { quarter: 'Q2-2025', accuracy: 75, total: 4, hits: 3, misses: 1 },
    ])

    mockGetTimeAllocation.mockResolvedValue([
      { name: 'Problem A', allocation: 50 },
      { name: 'Problem B', allocation: 50 },
    ])

    mockGetAvoidancePatterns.mockResolvedValue([
      { theme: 'salary', frequency: 3 },
    ])

    const request = new Request('http://localhost/api/analytics')
    const response = await getAnalytics(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('betAccuracy')
    expect(data).toHaveProperty('betTrend')
    expect(data).toHaveProperty('timeAllocation')
    expect(data).toHaveProperty('avoidancePatterns')
  })

  it('should return 401 if not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new Request('http://localhost/api/analytics')
    const response = await getAnalytics(request)

    expect(response.status).toBe(401)
  })
})

describe('GET /api/analytics/bets', () => {
  const mockUserId = 'user-123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return bet accuracy trend data', async () => {
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com' },
    } as any)

    mockGetBetAccuracyTrend.mockResolvedValue([
      { quarter: 'Q1-2025', accuracy: 50, total: 4, hits: 2, misses: 2 },
      { quarter: 'Q2-2025', accuracy: 75, total: 4, hits: 3, misses: 1 },
      { quarter: 'Q3-2025', accuracy: 80, total: 5, hits: 4, misses: 1 },
    ])

    const request = new Request('http://localhost/api/analytics/bets')
    const response = await getBetTrend(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.trend).toHaveLength(3)
    expect(data.trend[0]).toHaveProperty('quarter')
    expect(data.trend[0]).toHaveProperty('accuracy')
  })

  it('should return 401 if not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new Request('http://localhost/api/analytics/bets')
    const response = await getBetTrend(request)

    expect(response.status).toBe(401)
  })

  it('should handle empty data', async () => {
    mockAuth.mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com' },
    } as any)

    mockGetBetAccuracyTrend.mockResolvedValue([])

    const request = new Request('http://localhost/api/analytics/bets')
    const response = await getBetTrend(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.trend).toEqual([])
  })
})
