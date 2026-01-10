/**
 * @jest-environment node
 */
import { createMocks } from 'node-mocks-http'
import { POST as createBetHandler, GET as getBetsHandler } from '@/app/api/bets/route'
import { PATCH as resolveBetHandler } from '@/app/api/bets/[id]/resolve/route'
import { GET as getAccuracyHandler } from '@/app/api/bets/accuracy/route'

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

// Mock bet service
jest.mock('@/lib/bets/service', () => ({
  createBet: jest.fn(),
  getUserBets: jest.fn(),
  resolveBet: jest.fn(),
  calculateAccuracy: jest.fn(),
  getBetById: jest.fn(),
}))

import { auth } from '@/auth'
import * as betService from '@/lib/bets/service'

const mockAuth = auth as jest.MockedFunction<typeof auth>

describe('POST /api/bets', () => {
  const validBetData = {
    content: 'I will complete the feature by Q1',
    falsifiableCriteria: 'Feature deployed to production',
    deadline: '2024-03-31',
    quarter: 'Q1-2024',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a new bet', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    } as any)

    const expectedBet = {
      id: 'bet-456',
      ...validBetData,
      userId: 'user-123',
      status: 'pending',
    }

    ;(betService.createBet as jest.Mock).mockResolvedValue(expectedBet)

    const request = new Request('http://localhost/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBetData),
    })

    const response = await createBetHandler(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.id).toBe('bet-456')
    expect(data.status).toBe('pending')
  })

  it('should return 401 if not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new Request('http://localhost/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBetData),
    })

    const response = await createBetHandler(request)

    expect(response.status).toBe(401)
  })

  it('should return 400 for invalid data', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    } as any)

    const invalidData = {
      content: 'Test',
      // Missing required fields
    }

    const request = new Request('http://localhost/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData),
    })

    const response = await createBetHandler(request)

    expect(response.status).toBe(400)
  })
})

describe('GET /api/bets', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return all bets for authenticated user', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    } as any)

    const mockBets = [
      { id: 'bet-1', content: 'Bet 1', status: 'pending' },
      { id: 'bet-2', content: 'Bet 2', status: 'resolved' },
    ]

    ;(betService.getUserBets as jest.Mock).mockResolvedValue(mockBets)

    const request = new Request('http://localhost/api/bets', {
      method: 'GET',
    })

    const response = await getBetsHandler(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(2)
  })

  it('should return 401 if not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new Request('http://localhost/api/bets', {
      method: 'GET',
    })

    const response = await getBetsHandler(request)

    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/bets/[id]/resolve', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should resolve bet with outcome', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    } as any)

    const resolvedBet = {
      id: 'bet-456',
      status: 'resolved',
      outcome: 'hit',
      evidence: 'Shipped on time',
    }

    ;(betService.getBetById as jest.Mock).mockResolvedValue({
      id: 'bet-456',
      userId: 'user-123',
      status: 'pending',
    })
    ;(betService.resolveBet as jest.Mock).mockResolvedValue(resolvedBet)

    const request = new Request('http://localhost/api/bets/bet-456/resolve', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome: 'hit', evidence: 'Shipped on time' }),
    })

    const response = await resolveBetHandler(request, {
      params: Promise.resolve({ id: 'bet-456' }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.outcome).toBe('hit')
    expect(data.status).toBe('resolved')
  })

  it('should return 404 for non-existent bet', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    } as any)

    ;(betService.getBetById as jest.Mock).mockResolvedValue(null)

    const request = new Request('http://localhost/api/bets/non-existent/resolve', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome: 'hit' }),
    })

    const response = await resolveBetHandler(request, {
      params: Promise.resolve({ id: 'non-existent' }),
    })

    expect(response.status).toBe(404)
  })

  it('should return 403 if user does not own the bet', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    } as any)

    ;(betService.getBetById as jest.Mock).mockResolvedValue({
      id: 'bet-456',
      userId: 'different-user',
      status: 'pending',
    })

    const request = new Request('http://localhost/api/bets/bet-456/resolve', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome: 'hit' }),
    })

    const response = await resolveBetHandler(request, {
      params: Promise.resolve({ id: 'bet-456' }),
    })

    expect(response.status).toBe(403)
  })
})

describe('GET /api/bets/accuracy', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return accuracy stats for user', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    } as any)

    const accuracyStats = {
      percentage: 75,
      total: 8,
      hits: 6,
      misses: 2,
      excused: 1,
    }

    ;(betService.calculateAccuracy as jest.Mock).mockResolvedValue(accuracyStats)

    const request = new Request('http://localhost/api/bets/accuracy', {
      method: 'GET',
    })

    const response = await getAccuracyHandler(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.percentage).toBe(75)
    expect(data.total).toBe(8)
  })

  it('should return 401 if not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new Request('http://localhost/api/bets/accuracy', {
      method: 'GET',
    })

    const response = await getAccuracyHandler(request)

    expect(response.status).toBe(401)
  })

  it('should filter by quarter if provided', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    } as any)

    ;(betService.calculateAccuracy as jest.Mock).mockResolvedValue({
      percentage: 100,
      total: 2,
      hits: 2,
      misses: 0,
      excused: 0,
    })

    const request = new Request('http://localhost/api/bets/accuracy?quarter=Q1-2024', {
      method: 'GET',
    })

    const response = await getAccuracyHandler(request)

    expect(response.status).toBe(200)
    expect(betService.calculateAccuracy).toHaveBeenCalledWith('user-123', 'Q1-2024')
  })
})
