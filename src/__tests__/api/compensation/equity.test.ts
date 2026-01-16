/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(() => Promise.resolve({ user: { id: 'user1' } })),
}))

// Mock service
jest.mock('@/lib/compensation/service', () => ({
  createEquityGrant: jest.fn(),
  getEquityGrantById: jest.fn(),
  getUserEquityGrants: jest.fn(),
  updateEquityGrant: jest.fn(),
  recordVesting: jest.fn(),
  getUpcomingVestings: jest.fn(),
  getCompensationAnalytics: jest.fn(),
  getMarketBenchmark: jest.fn(),
}))

import { GET, POST } from '@/app/api/compensation/equity/route'
import { GET as GET_BY_ID, PUT } from '@/app/api/compensation/equity/[id]/route'
import { POST as RECORD_VESTING } from '@/app/api/compensation/vestings/route'
import { GET as GET_ANALYTICS } from '@/app/api/compensation/analytics/route'
import * as compensationService from '@/lib/compensation/service'

describe('Equity Grants API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/compensation/equity', () => {
    it('should return user equity grants', async () => {
      const mockGrants = [
        { id: 'g1', company: 'Tech Corp', totalShares: 1000 },
        { id: 'g2', company: 'Startup Inc', totalShares: 5000 },
      ]
      ;(compensationService.getUserEquityGrants as jest.Mock).mockResolvedValue(mockGrants)

      const request = new Request('http://localhost/api/compensation/equity')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
    })
  })

  describe('POST /api/compensation/equity', () => {
    it('should create an equity grant', async () => {
      const mockGrant = {
        id: 'g1',
        userId: 'user1',
        company: 'Tech Corp',
        totalShares: 1000,
      }
      ;(compensationService.createEquityGrant as jest.Mock).mockResolvedValue(mockGrant)

      const request = new Request('http://localhost/api/compensation/equity', {
        method: 'POST',
        body: JSON.stringify({
          company: 'Tech Corp',
          grantType: 'rsu',
          grantDate: '2024-01-01',
          totalShares: 1000,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('g1')
    })

    it('should return 400 for missing fields', async () => {
      const request = new Request('http://localhost/api/compensation/equity', {
        method: 'POST',
        body: JSON.stringify({ company: 'Tech Corp' }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/compensation/equity/[id]', () => {
    it('should return an equity grant', async () => {
      const mockGrant = {
        id: 'g1',
        company: 'Tech Corp',
        vestings: [],
      }
      ;(compensationService.getEquityGrantById as jest.Mock).mockResolvedValue(mockGrant)

      const request = new Request('http://localhost/api/compensation/equity/g1')
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'g1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('g1')
    })

    it('should return 404 for non-existent grant', async () => {
      ;(compensationService.getEquityGrantById as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost/api/compensation/equity/notfound')
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'notfound' }) })

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/compensation/equity/[id]', () => {
    it('should update an equity grant', async () => {
      const mockGrant = { id: 'g1', currentPrice: 150.00 }
      ;(compensationService.updateEquityGrant as jest.Mock).mockResolvedValue(mockGrant)

      const request = new Request('http://localhost/api/compensation/equity/g1', {
        method: 'PUT',
        body: JSON.stringify({ currentPrice: 150.00 }),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'g1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.currentPrice).toBe(150.00)
    })
  })
})

describe('Vesting API', () => {
  describe('POST /api/compensation/vestings', () => {
    it('should record a vesting event', async () => {
      ;(compensationService.recordVesting as jest.Mock).mockResolvedValue({
        id: 'g1',
        vestedShares: 250,
      })

      const request = new Request('http://localhost/api/compensation/vestings', {
        method: 'POST',
        body: JSON.stringify({
          vestingId: 'v1',
          grantId: 'g1',
          shares: 250,
        }),
      })

      const response = await RECORD_VESTING(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.vestedShares).toBe(250)
    })
  })
})

describe('Analytics API', () => {
  describe('GET /api/compensation/analytics', () => {
    it('should return compensation analytics', async () => {
      const mockAnalytics = {
        currentSalary: 150000,
        totalEquityValue: 25000,
        yearBonuses: 20000,
      }
      ;(compensationService.getCompensationAnalytics as jest.Mock).mockResolvedValue(mockAnalytics)

      const request = new Request('http://localhost/api/compensation/analytics')
      const response = await GET_ANALYTICS(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.currentSalary).toBe(150000)
    })
  })
})
