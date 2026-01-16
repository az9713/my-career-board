/**
 * @jest-environment node
 */

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

// Mock decisions service
jest.mock('@/lib/decisions/service', () => ({
  createDecision: jest.fn(),
  getDecisionById: jest.fn(),
  getUserDecisions: jest.fn(),
  updateDecision: jest.fn(),
  deleteDecision: jest.fn(),
  recordOutcome: jest.fn(),
  getDecisionsDueForReview: jest.fn(),
  getDecisionAnalytics: jest.fn(),
}))

import { auth } from '@/auth'
import {
  createDecision,
  getDecisionById,
  getUserDecisions,
  updateDecision,
  deleteDecision,
  recordOutcome,
  getDecisionsDueForReview,
  getDecisionAnalytics,
} from '@/lib/decisions/service'
import { GET, POST } from '@/app/api/decisions/route'
import { GET as getById, PUT, DELETE } from '@/app/api/decisions/[id]/route'
import { POST as postOutcome } from '@/app/api/decisions/[id]/outcome/route'
import { GET as getDueForReview } from '@/app/api/decisions/review/route'
import { GET as getAnalytics } from '@/app/api/decisions/analytics/route'

const mockAuth = auth as jest.Mock

describe('Decisions API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/decisions', () => {
    it('should return 401 if not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new Request('http://localhost/api/decisions')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should return user decisions', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockDecisions = [
        { id: 'd1', title: 'Decision 1', status: 'pending' },
        { id: 'd2', title: 'Decision 2', status: 'decided' },
      ]
      ;(getUserDecisions as jest.Mock).mockResolvedValue(mockDecisions)

      const request = new Request('http://localhost/api/decisions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.decisions).toHaveLength(2)
    })

    it('should filter by status', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
      ;(getUserDecisions as jest.Mock).mockResolvedValue([])

      const request = new Request('http://localhost/api/decisions?status=pending')
      await GET(request)

      expect(getUserDecisions).toHaveBeenCalledWith('user-1', { status: 'pending' })
    })
  })

  describe('POST /api/decisions', () => {
    it('should create a new decision', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const decisionData = {
        title: 'Accept job offer',
        description: 'Deciding on the new role',
        options: ['Accept', 'Decline'],
        category: 'role-change',
      }

      const mockDecision = { id: 'd1', ...decisionData, userId: 'user-1' }
      ;(createDecision as jest.Mock).mockResolvedValue(mockDecision)

      const request = new Request('http://localhost/api/decisions', {
        method: 'POST',
        body: JSON.stringify(decisionData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.decision.id).toBe('d1')
    })

    it('should return 400 for missing title', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const request = new Request('http://localhost/api/decisions', {
        method: 'POST',
        body: JSON.stringify({ description: 'No title' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/decisions/[id]', () => {
    it('should return decision by id', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockDecision = {
        id: 'd1',
        userId: 'user-1',
        title: 'Decision',
        outcome: null,
        tags: [],
      }
      ;(getDecisionById as jest.Mock).mockResolvedValue(mockDecision)

      const request = new Request('http://localhost/api/decisions/d1')
      const response = await getById(request, { params: Promise.resolve({ id: 'd1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.decision.id).toBe('d1')
    })

    it('should return 404 for non-existent decision', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
      ;(getDecisionById as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost/api/decisions/non-existent')
      const response = await getById(request, { params: Promise.resolve({ id: 'non-existent' }) })

      expect(response.status).toBe(404)
    })

    it('should return 403 for decision belonging to another user', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockDecision = { id: 'd1', userId: 'user-2', title: 'Decision' }
      ;(getDecisionById as jest.Mock).mockResolvedValue(mockDecision)

      const request = new Request('http://localhost/api/decisions/d1')
      const response = await getById(request, { params: Promise.resolve({ id: 'd1' }) })

      expect(response.status).toBe(403)
    })
  })

  describe('PUT /api/decisions/[id]', () => {
    it('should update a decision', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockDecision = { id: 'd1', userId: 'user-1', title: 'Decision' }
      ;(getDecisionById as jest.Mock).mockResolvedValue(mockDecision)

      const mockUpdated = { ...mockDecision, chosenOption: 'Accept', status: 'decided' }
      ;(updateDecision as jest.Mock).mockResolvedValue(mockUpdated)

      const request = new Request('http://localhost/api/decisions/d1', {
        method: 'PUT',
        body: JSON.stringify({ chosenOption: 'Accept', status: 'decided' }),
      })
      const response = await PUT(request, { params: Promise.resolve({ id: 'd1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.decision.status).toBe('decided')
    })
  })

  describe('DELETE /api/decisions/[id]', () => {
    it('should delete a decision', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockDecision = { id: 'd1', userId: 'user-1', title: 'Decision' }
      ;(getDecisionById as jest.Mock).mockResolvedValue(mockDecision)
      ;(deleteDecision as jest.Mock).mockResolvedValue(mockDecision)

      const request = new Request('http://localhost/api/decisions/d1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'd1' }) })

      expect(response.status).toBe(200)
      expect(deleteDecision).toHaveBeenCalledWith('d1')
    })
  })

  describe('POST /api/decisions/[id]/outcome', () => {
    it('should record decision outcome', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockDecision = { id: 'd1', userId: 'user-1', title: 'Decision' }
      ;(getDecisionById as jest.Mock).mockResolvedValue(mockDecision)

      const outcomeData = {
        actualOutcome: 'Took the job',
        accuracy: 5,
        lessonsLearned: 'Trust my instincts',
      }

      const mockOutcome = { id: 'o1', decisionId: 'd1', ...outcomeData }
      ;(recordOutcome as jest.Mock).mockResolvedValue(mockOutcome)

      const request = new Request('http://localhost/api/decisions/d1/outcome', {
        method: 'POST',
        body: JSON.stringify(outcomeData),
      })
      const response = await postOutcome(request, { params: Promise.resolve({ id: 'd1' }) })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.outcome.accuracy).toBe(5)
    })
  })

  describe('GET /api/decisions/review', () => {
    it('should return decisions due for review', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockDecisions = [
        { id: 'd1', title: 'Decision 1', revisitAt: new Date() },
      ]
      ;(getDecisionsDueForReview as jest.Mock).mockResolvedValue(mockDecisions)

      const request = new Request('http://localhost/api/decisions/review')
      const response = await getDueForReview(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.decisions).toHaveLength(1)
    })
  })

  describe('GET /api/decisions/analytics', () => {
    it('should return decision analytics', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockAnalytics = {
        totalDecisions: 10,
        averageAccuracy: 4.2,
        decisionsByStatus: { pending: 3, decided: 5, closed: 2 },
        decisionsByCategory: { 'role-change': 4, compensation: 6 },
        recentDecisions: [],
      }
      ;(getDecisionAnalytics as jest.Mock).mockResolvedValue(mockAnalytics)

      const request = new Request('http://localhost/api/decisions/analytics')
      const response = await getAnalytics(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.analytics.totalDecisions).toBe(10)
    })
  })
})
