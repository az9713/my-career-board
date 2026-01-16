/**
 * @jest-environment node
 */

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

// Mock evidence service
jest.mock('@/lib/evidence/service', () => ({
  createEvidence: jest.fn(),
  getEvidenceById: jest.fn(),
  getUserEvidence: jest.fn(),
  updateEvidence: jest.fn(),
  deleteEvidence: jest.fn(),
  linkEvidenceToProblem: jest.fn(),
  unlinkEvidenceFromProblem: jest.fn(),
  getEvidenceByProblem: jest.fn(),
  getEvidenceSummary: jest.fn(),
  searchEvidence: jest.fn(),
}))

import { auth } from '@/auth'
import {
  createEvidence,
  getEvidenceById,
  getUserEvidence,
  updateEvidence,
  deleteEvidence,
  getEvidenceSummary,
  searchEvidence,
} from '@/lib/evidence/service'
import { GET, POST, DELETE } from '@/app/api/evidence/route'
import { GET as getById, PUT, DELETE as deleteById } from '@/app/api/evidence/[id]/route'
import { GET as getSummary } from '@/app/api/evidence/summary/route'

const mockAuth = auth as jest.Mock

describe('Evidence API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/evidence', () => {
    it('should return 401 if not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new Request('http://localhost/api/evidence')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should return user evidence', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockEvidence = [
        { id: 'e1', title: 'Win 1', type: 'win' },
        { id: 'e2', title: 'Feedback 1', type: 'feedback' },
      ]
      ;(getUserEvidence as jest.Mock).mockResolvedValue(mockEvidence)

      const request = new Request('http://localhost/api/evidence')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.evidence).toHaveLength(2)
    })

    it('should filter by type', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
      ;(getUserEvidence as jest.Mock).mockResolvedValue([])

      const request = new Request('http://localhost/api/evidence?type=win')
      await GET(request)

      expect(getUserEvidence).toHaveBeenCalledWith('user-1', { type: 'win' })
    })

    it('should search by keyword', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
      ;(searchEvidence as jest.Mock).mockResolvedValue([])

      const request = new Request('http://localhost/api/evidence?search=dashboard')
      await GET(request)

      expect(searchEvidence).toHaveBeenCalledWith('user-1', 'dashboard')
    })
  })

  describe('POST /api/evidence', () => {
    it('should return 401 if not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new Request('http://localhost/api/evidence', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should create new evidence', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const evidenceData = {
        title: 'Shipped new feature',
        description: 'Led development',
        type: 'win',
        impact: '25% engagement increase',
      }

      const mockCreated = { id: 'e1', ...evidenceData, userId: 'user-1' }
      ;(createEvidence as jest.Mock).mockResolvedValue(mockCreated)

      const request = new Request('http://localhost/api/evidence', {
        method: 'POST',
        body: JSON.stringify(evidenceData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.evidence.id).toBe('e1')
      expect(createEvidence).toHaveBeenCalledWith({
        ...evidenceData,
        userId: 'user-1',
      })
    })

    it('should return 400 for missing required fields', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const request = new Request('http://localhost/api/evidence', {
        method: 'POST',
        body: JSON.stringify({ description: 'No title' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/evidence/[id]', () => {
    it('should return evidence by id', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockEvidence = {
        id: 'e1',
        userId: 'user-1',
        title: 'Win',
        type: 'win',
      }
      ;(getEvidenceById as jest.Mock).mockResolvedValue(mockEvidence)

      const request = new Request('http://localhost/api/evidence/e1')
      const response = await getById(request, { params: Promise.resolve({ id: 'e1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.evidence.id).toBe('e1')
    })

    it('should return 404 for non-existent evidence', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
      ;(getEvidenceById as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost/api/evidence/non-existent')
      const response = await getById(request, { params: Promise.resolve({ id: 'non-existent' }) })

      expect(response.status).toBe(404)
    })

    it('should return 403 for evidence belonging to another user', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockEvidence = {
        id: 'e1',
        userId: 'user-2',
        title: 'Win',
      }
      ;(getEvidenceById as jest.Mock).mockResolvedValue(mockEvidence)

      const request = new Request('http://localhost/api/evidence/e1')
      const response = await getById(request, { params: Promise.resolve({ id: 'e1' }) })

      expect(response.status).toBe(403)
    })
  })

  describe('PUT /api/evidence/[id]', () => {
    it('should update evidence', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockEvidence = { id: 'e1', userId: 'user-1', title: 'Win' }
      ;(getEvidenceById as jest.Mock).mockResolvedValue(mockEvidence)

      const mockUpdated = { ...mockEvidence, title: 'Updated Win' }
      ;(updateEvidence as jest.Mock).mockResolvedValue(mockUpdated)

      const request = new Request('http://localhost/api/evidence/e1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated Win' }),
      })
      const response = await PUT(request, { params: Promise.resolve({ id: 'e1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.evidence.title).toBe('Updated Win')
    })
  })

  describe('DELETE /api/evidence/[id]', () => {
    it('should delete evidence', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockEvidence = { id: 'e1', userId: 'user-1', title: 'Win' }
      ;(getEvidenceById as jest.Mock).mockResolvedValue(mockEvidence)
      ;(deleteEvidence as jest.Mock).mockResolvedValue(mockEvidence)

      const request = new Request('http://localhost/api/evidence/e1', {
        method: 'DELETE',
      })
      const response = await deleteById(request, { params: Promise.resolve({ id: 'e1' }) })

      expect(response.status).toBe(200)
      expect(deleteEvidence).toHaveBeenCalledWith('e1')
    })
  })

  describe('GET /api/evidence/summary', () => {
    it('should return evidence summary', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

      const mockSummary = {
        totalCount: 10,
        byType: { win: 5, feedback: 3, metric: 2 },
        bySource: { self: 6, manager: 4 },
        recentEvidence: [],
      }
      ;(getEvidenceSummary as jest.Mock).mockResolvedValue(mockSummary)

      const request = new Request('http://localhost/api/evidence/summary')
      const response = await getSummary(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary.totalCount).toBe(10)
    })

    it('should filter summary by date range', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
      ;(getEvidenceSummary as jest.Mock).mockResolvedValue({ totalCount: 0, byType: {}, bySource: {}, recentEvidence: [] })

      const request = new Request('http://localhost/api/evidence/summary?startDate=2024-01-01&endDate=2024-03-31')
      await getSummary(request)

      expect(getEvidenceSummary).toHaveBeenCalledWith('user-1', {
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      })
    })
  })
})
