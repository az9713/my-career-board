/**
 * @jest-environment node
 */

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

// Mock feedback360 service
jest.mock('@/lib/feedback360/service', () => ({
  createFeedbackRequest: jest.fn(),
  getFeedbackRequestById: jest.fn(),
  getUserFeedbackRequests: jest.fn(),
  addFeedbackQuestion: jest.fn(),
  addFeedbackRecipient: jest.fn(),
  submitFeedbackResponse: jest.fn(),
  getFeedbackResults: jest.fn(),
  closeFeedbackRequest: jest.fn(),
  createSelfAssessment: jest.fn(),
  getSelfAssessments: jest.fn(),
  compareFeedbackToSelfAssessment: jest.fn(),
  getResponseByToken: jest.fn(),
}))

import { auth } from '@/auth'
import * as feedbackService from '@/lib/feedback360/service'
import { GET, POST } from '@/app/api/feedback/route'
import { GET as getById, PUT } from '@/app/api/feedback/[id]/route'
import { POST as submitResponse } from '@/app/api/feedback/respond/route'
import { GET as getResults } from '@/app/api/feedback/[id]/results/route'
import { GET as getSelfAssessments, POST as createSelfAssessment } from '@/app/api/feedback/self-assessment/route'

const mockAuth = auth as jest.Mock

describe('Feedback360 API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/feedback', () => {
    it('should return user feedback requests', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user1' } })
      const mockRequests = [
        { id: 'req1', title: 'Q1 Feedback' },
        { id: 'req2', title: 'Q2 Feedback' },
      ]
      ;(feedbackService.getUserFeedbackRequests as jest.Mock).mockResolvedValue(mockRequests)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.requests).toEqual(mockRequests)
    })

    it('should return 401 if not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const response = await GET()

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/feedback', () => {
    it('should create a feedback request', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user1' } })
      const mockRequest = { id: 'req1', title: 'Q1 Feedback' }
      ;(feedbackService.createFeedbackRequest as jest.Mock).mockResolvedValue(mockRequest)

      const request = new Request('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Q1 Feedback',
          description: 'Annual review',
          anonymous: true,
          questions: [
            { question: 'Rate leadership', category: 'leadership', type: 'scale' },
          ],
          recipients: [
            { email: 'peer@example.com', name: 'John', relationship: 'peer' },
          ],
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.request).toEqual(mockRequest)
    })
  })

  describe('GET /api/feedback/[id]', () => {
    it('should return feedback request by id', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user1' } })
      const mockRequest = { id: 'req1', title: 'Q1 Feedback', userId: 'user1' }
      ;(feedbackService.getFeedbackRequestById as jest.Mock).mockResolvedValue(mockRequest)

      const request = new Request('http://localhost/api/feedback/req1')
      const response = await getById(request as any, { params: Promise.resolve({ id: 'req1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.request).toEqual(mockRequest)
    })

    it('should return 404 if not found', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user1' } })
      ;(feedbackService.getFeedbackRequestById as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost/api/feedback/invalid')
      const response = await getById(request as any, { params: Promise.resolve({ id: 'invalid' }) })

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/feedback/[id]', () => {
    it('should close a feedback request', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user1' } })
      const mockRequest = { id: 'req1', status: 'closed', userId: 'user1' }
      ;(feedbackService.getFeedbackRequestById as jest.Mock).mockResolvedValue({ id: 'req1', userId: 'user1' })
      ;(feedbackService.closeFeedbackRequest as jest.Mock).mockResolvedValue(mockRequest)

      const request = new Request('http://localhost/api/feedback/req1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'closed' }),
      })

      const response = await PUT(request as any, { params: Promise.resolve({ id: 'req1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.request.status).toBe('closed')
    })
  })

  describe('POST /api/feedback/respond', () => {
    it('should submit feedback response', async () => {
      const mockRecipient = {
        id: 'rec1',
        responded: false,
        request: { id: 'req1' },
      }
      const mockResponse = { id: 'resp1' }
      ;(feedbackService.getResponseByToken as jest.Mock).mockResolvedValue(mockRecipient)
      ;(feedbackService.submitFeedbackResponse as jest.Mock).mockResolvedValue(mockResponse)

      const request = new Request('http://localhost/api/feedback/respond', {
        method: 'POST',
        body: JSON.stringify({
          token: 'abc123',
          relationship: 'peer',
          answers: [
            { questionId: 'q1', scaleValue: 4 },
          ],
        }),
      })

      const response = await submitResponse(request as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.response).toEqual(mockResponse)
    })

    it('should return 404 for invalid token', async () => {
      ;(feedbackService.getResponseByToken as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost/api/feedback/respond', {
        method: 'POST',
        body: JSON.stringify({
          token: 'invalid',
          answers: [],
        }),
      })

      const response = await submitResponse(request as any)

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/feedback/[id]/results', () => {
    it('should return aggregated feedback results', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user1' } })
      const mockRequest = { id: 'req1', userId: 'user1' }
      const mockResults = {
        requestId: 'req1',
        totalResponses: 5,
        byCategory: { leadership: { average: 4.2 } },
      }
      ;(feedbackService.getFeedbackRequestById as jest.Mock).mockResolvedValue(mockRequest)
      ;(feedbackService.getFeedbackResults as jest.Mock).mockResolvedValue(mockResults)

      const request = new Request('http://localhost/api/feedback/req1/results')
      const response = await getResults(request as any, { params: Promise.resolve({ id: 'req1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.results.totalResponses).toBe(5)
    })
  })

  describe('Self Assessment API', () => {
    it('should get self assessments', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user1' } })
      const mockAssessments = [
        { id: 'sa1', category: 'leadership', rating: 4 },
      ]
      ;(feedbackService.getSelfAssessments as jest.Mock).mockResolvedValue(mockAssessments)

      const request = new Request('http://localhost/api/feedback/self-assessment')
      const response = await getSelfAssessments(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.assessments).toEqual(mockAssessments)
    })

    it('should create self assessment', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user1' } })
      const mockAssessment = { id: 'sa1', category: 'leadership', rating: 4 }
      ;(feedbackService.createSelfAssessment as jest.Mock).mockResolvedValue(mockAssessment)

      const request = new Request('http://localhost/api/feedback/self-assessment', {
        method: 'POST',
        body: JSON.stringify({
          category: 'leadership',
          area: 'decision-making',
          rating: 4,
        }),
      })

      const response = await createSelfAssessment(request as any)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.assessment).toEqual(mockAssessment)
    })
  })
})
